package com.trilanetech.api.auth;

import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.common.Texts;
import com.trilanetech.api.user.User;
import com.trilanetech.api.user.UserDto;
import com.trilanetech.api.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Sign-in, sessions, lockout and password links. */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /** Same answer for unknown email, wrong password, locked or deactivated account. */
    static final String SIGN_IN_FAILED =
            "Email or password is incorrect. After 5 failed attempts, sign-in is paused for 15 minutes.";
    static final String FORGOT_PASSWORD_REPLY =
            "If an account exists for that email, a reset link is on its way. It expires in 1 hour.";

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordTokenRepository passwordTokens;
    private final PasswordTokenService passwordTokenService;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AppProperties props;
    private final String dummyHash;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens,
                       PasswordTokenRepository passwordTokens, PasswordTokenService passwordTokenService,
                       PasswordEncoder encoder, JwtService jwtService, AppProperties props) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordTokens = passwordTokens;
        this.passwordTokenService = passwordTokenService;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.props = props;
        // Used to spend the same time on unknown emails as on real ones.
        this.dummyHash = encoder.encode("timing-equaliser-not-a-real-password");
    }

    /** Result of a successful sign-in or refresh: the response body plus the new refresh cookie value. */
    public record Session(AuthDtos.SessionResponse body, String refreshToken) {}

    @Transactional(noRollbackFor = ApiException.class)
    public Session login(String email, String password) {
        Instant now = Instant.now();
        Optional<User> found = users.findByEmailIgnoreCase(Texts.normalizeEmail(email));
        if (found.isEmpty()) {
            encoder.matches(password, dummyHash);
            throw failed();
        }
        User user = found.get();
        if (!user.isActive() || !user.hasPassword() || user.isLocked(now)) {
            encoder.matches(password, dummyHash);
            throw failed();
        }
        if (!encoder.matches(password, user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            if (attempts >= props.auth().maxFailedAttempts()) {
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(now.plus(Duration.ofMinutes(props.auth().lockoutMinutes())));
                log.warn("Account locked after repeated failed sign-ins: userId={}", user.getId());
            } else {
                user.setFailedLoginAttempts(attempts);
            }
            throw failed();
        }
        user.clearLockout();
        user.setLastLoginAt(now);
        return startSession(user, now);
    }

    /** Swaps a refresh token for a new access token and a new refresh token. */
    @Transactional(noRollbackFor = ApiException.class)
    public Session refresh(String rawRefreshToken) {
        Instant now = Instant.now();
        if (rawRefreshToken == null || rawRefreshToken.isBlank() || rawRefreshToken.length() > 200) {
            throw sessionExpired();
        }
        RefreshToken token = refreshTokens.findByTokenHash(SecureTokens.hash(rawRefreshToken))
                .orElseThrow(this::sessionExpired);
        User user = token.getUser();
        if (token.isRevoked()) {
            // A revoked token being reused suggests it was copied. End every session for this user.
            refreshTokens.revokeAllForUser(user.getId(), now);
            log.warn("Revoked refresh token reused; all sessions ended: userId={}", user.getId());
            throw sessionExpired();
        }
        if (!token.getExpiresAt().isAfter(now) || !user.isActive()) {
            token.revoke(now);
            throw sessionExpired();
        }
        token.revoke(now);
        return startSession(user, now);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank() || rawRefreshToken.length() > 200) {
            return;
        }
        refreshTokens.findByTokenHash(SecureTokens.hash(rawRefreshToken))
                .filter(t -> !t.isRevoked())
                .ifPresent(t -> t.revoke(Instant.now()));
    }

    /** Always succeeds from the caller's point of view, so it never reveals which emails exist. */
    @Transactional
    public void forgotPassword(String email) {
        users.findByEmailIgnoreCase(Texts.normalizeEmail(email))
                .filter(User::isActive)
                .ifPresent(user -> passwordTokenService.issueAndSend(user, PasswordToken.Purpose.RESET));
    }

    @Transactional
    public void setPassword(String rawToken, String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Some fields need attention.",
                    Map.of("password", "Use a shorter password (at most 72 bytes)."));
        }
        PasswordToken token = passwordTokenService.findUsable(rawToken)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN",
                        "This link is invalid or has expired. Ask for a new one."));
        Instant now = Instant.now();
        User user = token.getUser();
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN",
                    "This link is invalid or has expired. Ask for a new one.");
        }
        user.setPasswordHash(encoder.encode(password));
        user.clearLockout();
        passwordTokens.retireAllForUser(user.getId(), now);
        // A new password ends every existing session.
        refreshTokens.revokeAllForUser(user.getId(), now);
    }

    @Transactional(readOnly = true)
    public UserDto me(long userId) {
        return users.findById(userId).map(UserDto::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Please sign in."));
    }

    private Session startSession(User user, Instant now) {
        String raw = SecureTokens.generate();
        refreshTokens.save(new RefreshToken(user, SecureTokens.hash(raw),
                now.plus(Duration.ofDays(props.jwt().refreshTokenDays()))));
        String access = jwtService.issueAccessToken(user);
        return new Session(new AuthDtos.SessionResponse(access, jwtService.accessTokenSeconds(), UserDto.from(user)),
                raw);
    }

    /** Removes refresh tokens that expired more than a day ago. */
    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void purgeExpiredSessions() {
        int removed = refreshTokens.deleteExpiredBefore(Instant.now().minus(Duration.ofDays(1)));
        if (removed > 0) {
            log.info("Removed expired sessions: count={}", removed);
        }
    }

    private ApiException failed() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", SIGN_IN_FAILED);
    }

    private ApiException sessionExpired() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED", "Your session has ended. Please sign in again.");
    }
}

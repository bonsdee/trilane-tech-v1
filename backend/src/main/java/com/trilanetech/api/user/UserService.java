package com.trilanetech.api.user;

import com.trilanetech.api.auth.PasswordToken;
import com.trilanetech.api.auth.PasswordTokenService;
import com.trilanetech.api.auth.RefreshTokenRepository;
import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.Texts;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Team accounts: invites, re-invites, deactivation and reactivation. */
@Service
public class UserService {

    private final UserRepository users;
    private final PasswordTokenService passwordTokens;
    private final RefreshTokenRepository refreshTokens;

    public UserService(UserRepository users, PasswordTokenService passwordTokens,
                       RefreshTokenRepository refreshTokens) {
        this.users = users;
        this.passwordTokens = passwordTokens;
        this.refreshTokens = refreshTokens;
    }

    @Transactional(readOnly = true)
    public List<UserDto> list() {
        return users.findAllByOrderByFullNameAsc().stream().map(UserDto::from).toList();
    }

    /** Creates an account without a password and emails a set-password link valid for 72 hours. */
    @Transactional
    public UserDto invite(String fullName, String email) {
        String normalized = Texts.normalizeEmail(email);
        if (users.existsByEmailIgnoreCase(normalized)) {
            throw ApiException.conflict("An account with this email already exists.");
        }
        User user = users.save(new User(Texts.clean(fullName), normalized, Role.ADMIN));
        passwordTokens.issueAndSend(user, PasswordToken.Purpose.INVITE);
        return UserDto.from(user);
    }

    @Transactional
    public UserDto resendInvite(long id) {
        User user = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        if (user.hasPassword()) {
            throw ApiException.conflict("This person has already set a password. They can use \"Forgot password\" instead.");
        }
        if (!user.isActive()) {
            throw ApiException.conflict("Reactivate this account before sending a new invite.");
        }
        passwordTokens.issueAndSend(user, PasswordToken.Purpose.INVITE);
        return UserDto.from(user);
    }

    @Transactional
    public UserDto setActive(long id, boolean active, long actingUserId) {
        User user = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        if (user.isActive() == active) {
            return UserDto.from(user);
        }
        if (!active) {
            if (id == actingUserId) {
                throw ApiException.conflict("You cannot deactivate your own account.");
            }
            if (user.getRole() == Role.ADMIN && user.hasPassword()
                    && users.countUsableAdminsExcluding(Role.ADMIN, user.getId()) == 0) {
                throw ApiException.conflict("At least one active admin must remain.");
            }
            user.setActive(false);
            refreshTokens.revokeAllForUser(user.getId(), Instant.now());
        } else {
            user.setActive(true);
            user.clearLockout();
        }
        return UserDto.from(user);
    }
}

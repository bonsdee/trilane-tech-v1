package com.trilanetech.api.auth;

import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.user.User;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates and checks single-use invite and reset links. */
@Service
public class PasswordTokenService {

    private final PasswordTokenRepository tokens;
    private final ApplicationEventPublisher events;
    private final AppProperties props;

    public PasswordTokenService(PasswordTokenRepository tokens, ApplicationEventPublisher events,
                                AppProperties props) {
        this.tokens = tokens;
        this.events = events;
        this.props = props;
    }

    /**
     * Retires the user's earlier links, stores a new one and emails it after
     * the surrounding transaction commits.
     */
    @Transactional
    public void issueAndSend(User user, PasswordToken.Purpose purpose) {
        Instant now = Instant.now();
        tokens.retireAllForUser(user.getId(), now);
        Duration validity = purpose == PasswordToken.Purpose.INVITE
                ? Duration.ofHours(props.auth().inviteValidHours())
                : Duration.ofMinutes(props.auth().resetValidMinutes());
        String raw = SecureTokens.generate();
        tokens.save(new PasswordToken(user, SecureTokens.hash(raw), purpose, now.plus(validity)));

        String link = props.siteBaseUrl() + "/admin/set-password?token="
                + URLEncoder.encode(raw, StandardCharsets.UTF_8)
                + "&type=" + purpose.name().toLowerCase();
        events.publishEvent(new PasswordLinkEvent(user.getEmail(), user.getFullName(), link, purpose,
                describe(validity)));
    }

    /** Finds a link that is unused and not expired. */
    @Transactional(readOnly = true)
    public Optional<PasswordToken> findUsable(String rawToken) {
        if (rawToken == null || rawToken.isBlank() || rawToken.length() > 200) {
            return Optional.empty();
        }
        return tokens.findByTokenHash(SecureTokens.hash(rawToken))
                .filter(t -> t.isUsable(Instant.now()));
    }

    static String describe(Duration duration) {
        long hours = duration.toHours();
        if (hours >= 1 && duration.toMinutes() % 60 == 0) {
            return hours == 1 ? "1 hour" : hours + " hours";
        }
        return duration.toMinutes() + " minutes";
    }
}

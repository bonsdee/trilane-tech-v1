package com.trilanetech.api.common;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the {@code app.*} settings in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String siteUrl,
        String corsAllowedOrigins,
        String timezone,
        Jwt jwt,
        Auth auth,
        Mail mail,
        Admin admin,
        Uploads uploads,
        RateLimit rateLimit) {

    public record Jwt(String secret, String issuer, int accessTokenMinutes, int refreshTokenDays) {}

    public record Auth(boolean cookieSecure, String cookieSameSite, int maxFailedAttempts,
                       int lockoutMinutes, int inviteValidHours, int resetValidMinutes) {}

    public record Mail(String from, String leadNotificationTo) {
        public List<String> leadRecipients() {
            return splitList(leadNotificationTo);
        }
    }

    public record Admin(String email, String name) {}

    public record Uploads(String dir, long maxBytes) {}

    public record RateLimit(int leadSubmissions, int windowMinutes) {}

    public List<String> allowedOrigins() {
        return splitList(corsAllowedOrigins);
    }

    /** Site URL without a trailing slash, for building links. */
    public String siteBaseUrl() {
        return siteUrl.endsWith("/") ? siteUrl.substring(0, siteUrl.length() - 1) : siteUrl;
    }

    static List<String> splitList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}

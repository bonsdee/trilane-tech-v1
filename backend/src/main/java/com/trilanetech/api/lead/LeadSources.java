package com.trilanetech.api.lead;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Root;
import java.net.URI;
import java.util.Locale;

/**
 * Where a lead came from, as one short label: the UTM source tag if the visit
 * had one, otherwise the referring site's domain, otherwise "direct".
 * The same rule exists in Java, in JPA criteria (for filtering) and in SQL
 * (for the overview counts) so the three always agree.
 */
public final class LeadSources {

    public static final String DIRECT = "direct";
    static final String HOST_REGEX = "^https?://(www\\.)?([^/:?#]+).*$";

    /** SQL version, for native queries on the leads table. */
    public static final String SQL_EXPRESSION =
            "CASE WHEN utm_source IS NOT NULL AND btrim(utm_source) <> '' THEN lower(btrim(utm_source)) "
            + "WHEN referrer ~* '^https?://' THEN lower(regexp_replace(referrer, '" + HOST_REGEX + "', '\\2')) "
            + "ELSE '" + DIRECT + "' END";

    private LeadSources() {}

    public static String of(String utmSource, String referrer) {
        if (utmSource != null && !utmSource.isBlank()) {
            return utmSource.strip().toLowerCase(Locale.ROOT);
        }
        if (referrer != null && referrer.matches("(?i)^https?://.*")) {
            try {
                String host = URI.create(referrer.strip()).getHost();
                if (host != null) {
                    host = host.toLowerCase(Locale.ROOT);
                    return host.startsWith("www.") ? host.substring(4) : host;
                }
            } catch (IllegalArgumentException ignored) {
                // fall through to the regex used by the database
            }
            return referrer.replaceAll("(?i)" + HOST_REGEX, "$2").toLowerCase(Locale.ROOT);
        }
        return DIRECT;
    }

    /** Criteria version, used by the lead list filter. */
    static Expression<String> expression(Root<Lead> root, CriteriaBuilder cb) {
        Expression<String> utm = root.get("utmSource");
        Expression<String> referrer = root.get("referrer");
        Expression<String> host = cb.lower(cb.function("regexp_replace", String.class, referrer,
                cb.literal(HOST_REGEX), cb.literal("\\2")));
        return cb.<String>selectCase()
                .when(cb.and(cb.isNotNull(utm), cb.notEqual(cb.trim(utm), "")), cb.lower(cb.trim(utm)))
                .when(cb.like(cb.lower(referrer), "http%"), host)
                .otherwise(cb.literal(DIRECT));
    }
}

package com.trilanetech.api.common;

import java.util.Locale;

/** Small string helpers used when accepting user input. */
public final class Texts {

    private Texts() {}

    /** Trims and turns blank strings into null. */
    public static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Trims, then cuts to a maximum length; blank becomes null. */
    public static String clip(String value, int max) {
        String cleaned = clean(value);
        if (cleaned == null) {
            return null;
        }
        return cleaned.length() > max ? cleaned.substring(0, max) : cleaned;
    }

    public static String normalizeEmail(String email) {
        String cleaned = clean(email);
        return cleaned == null ? null : cleaned.toLowerCase(Locale.ROOT);
    }
}

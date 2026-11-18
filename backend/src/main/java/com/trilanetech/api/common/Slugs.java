package com.trilanetech.api.common;

/** Rules for URL-friendly identifiers such as "foundation-website". */
public final class Slugs {

    public static final String PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    public static final String MESSAGE = "Use lowercase letters, numbers and single hyphens, like \"my-project\".";

    private Slugs() {}
}

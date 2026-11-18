package com.trilanetech.api.auth;

/**
 * Published when an invite or reset link is created. The email listener sends
 * it after the database transaction commits. The raw token only exists in
 * memory and in the email itself.
 */
public record PasswordLinkEvent(String email, String fullName, String link, PasswordToken.Purpose purpose,
                                String validFor) {}

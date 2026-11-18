package com.trilanetech.api.auth;

import com.trilanetech.api.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

/** Reads the signed-in user's id from the security context. */
public final class CurrentUser {

    private CurrentUser() {}

    public static long id(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Please sign in.");
        }
        return Long.parseLong(authentication.getName());
    }
}

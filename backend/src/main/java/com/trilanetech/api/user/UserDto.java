package com.trilanetech.api.user;

import java.time.Instant;

/** A team account as returned by the API. Never includes the password hash. */
public record UserDto(Long id, String fullName, String email, Role role, boolean active, String status,
                      Instant lastLoginAt, Instant createdAt) {

    public static UserDto from(User user) {
        String status;
        if (!user.isActive()) {
            status = "DEACTIVATED";
        } else if (!user.hasPassword()) {
            status = "INVITED";
        } else {
            status = "ACTIVE";
        }
        return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.isActive(),
                status, user.getLastLoginAt(), user.getCreatedAt());
    }
}

package com.trilanetech.api.auth;

import com.trilanetech.api.user.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request and response bodies for /api/v1/auth. */
public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank(message = "Enter your email address.") @Size(max = 254) String email,
            @NotBlank(message = "Enter your password.") @Size(max = 200) String password) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "Enter your email address.")
            @Email(message = "Enter a valid email address.")
            @Size(max = 254) String email) {}

    public record SetPasswordRequest(
            @NotBlank(message = "This link is missing its token.") @Size(max = 200) String token,
            @NotBlank(message = "Enter a new password.")
            @Size(min = 10, max = 72, message = "Use between 10 and 72 characters.") String password) {}

    public record SessionResponse(String accessToken, long expiresIn, UserDto user) {}

    public record MessageResponse(String message) {}
}

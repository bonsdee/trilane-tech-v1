package com.trilanetech.api.auth;

import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.ApiResponse;
import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.user.UserDto;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    static final String REFRESH_COOKIE = "trilane_refresh";
    static final String COOKIE_PATH = "/api/v1/auth";

    private final AuthService authService;
    private final AppProperties props;

    public AuthController(AuthService authService, AppProperties props) {
        this.authService = authService;
        this.props = props;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDtos.SessionResponse>> login(@Valid @RequestBody AuthDtos.LoginRequest body) {
        return withSession(authService.login(body.email(), body.password()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthDtos.SessionResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        try {
            return withSession(authService.refresh(refreshToken));
        } catch (ApiException e) {
            response.addHeader(HttpHeaders.SET_COOKIE, clearCookie().toString());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, clearCookie().toString()).build();
    }

    @PostMapping("/forgot-password")
    public ApiResponse<AuthDtos.MessageResponse> forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest body) {
        authService.forgotPassword(body.email());
        return ApiResponse.of(new AuthDtos.MessageResponse(AuthService.FORGOT_PASSWORD_REPLY));
    }

    @PostMapping("/set-password")
    public ApiResponse<AuthDtos.MessageResponse> setPassword(@Valid @RequestBody AuthDtos.SetPasswordRequest body) {
        authService.setPassword(body.token(), body.password());
        return ApiResponse.of(new AuthDtos.MessageResponse("Your password is set. You can sign in now."));
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me(Authentication authentication) {
        return ApiResponse.of(authService.me(CurrentUser.id(authentication)));
    }

    private ResponseEntity<ApiResponse<AuthDtos.SessionResponse>> withSession(AuthService.Session session) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, session.refreshToken())
                .httpOnly(true)
                .secure(props.auth().cookieSecure())
                .sameSite(props.auth().cookieSameSite())
                .path(COOKIE_PATH)
                .maxAge(Duration.ofDays(props.jwt().refreshTokenDays()))
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(ApiResponse.of(session.body()));
    }

    private ResponseCookie clearCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(props.auth().cookieSecure())
                .sameSite(props.auth().cookieSameSite())
                .path(COOKIE_PATH)
                .maxAge(0)
                .build();
    }
}

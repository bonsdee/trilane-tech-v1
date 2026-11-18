package com.trilanetech.api.user;

import com.trilanetech.api.auth.CurrentUser;
import com.trilanetech.api.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    public record InviteRequest(
            @NotBlank(message = "Enter the person's name.") @Size(max = 120, message = "Use at most 120 characters.") String fullName,
            @NotBlank(message = "Enter an email address.") @Email(message = "Enter a valid email address.")
            @Size(max = 254, message = "Use at most 254 characters.") String email) {}

    public record UpdateRequest(@NotNull(message = "Choose active or inactive.") Boolean active) {}

    @GetMapping
    public ApiResponse<List<UserDto>> list() {
        return ApiResponse.of(userService.list());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserDto> invite(@Valid @RequestBody InviteRequest body) {
        return ApiResponse.of(userService.invite(body.fullName(), body.email()));
    }

    @PostMapping("/{id}/resend-invite")
    public ApiResponse<UserDto> resendInvite(@PathVariable long id) {
        return ApiResponse.of(userService.resendInvite(id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<UserDto> update(@PathVariable long id, @Valid @RequestBody UpdateRequest body,
                                       Authentication authentication) {
        return ApiResponse.of(userService.setActive(id, body.active(), CurrentUser.id(authentication)));
    }
}

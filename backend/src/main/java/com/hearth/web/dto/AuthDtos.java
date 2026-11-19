package com.hearth.web.dto;

import com.hearth.domain.Permission;
import com.hearth.domain.Role;
import com.hearth.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Username is required") String username,
            @NotBlank(message = "Password is required") String password,
            @NotBlank(message = "Choose a role") String role
    ) {
    }

    public record ProfileUpdateRequest(
            @NotBlank(message = "Name is required") @Size(min = 3, max = 80) String name,
            @NotBlank @Email String email,
            @Size(max = 100) String password
    ) {
    }

    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 80) String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 100) String password
    ) {
    }

    public record UserProfile(
            Long id,
            String username,
            String email,
            boolean enabled,
            LocalDateTime createdAt,
            List<String> roles,
            List<String> permissions
    ) {
        public static UserProfile from(User user) {
            List<String> roles = user.getRoles().stream().map(Role::getName).sorted().toList();
            List<String> permissions = user.getRoles().stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(Permission::getName)
                    .distinct()
                    .sorted(Comparator.naturalOrder())
                    .toList();
            return new UserProfile(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.isEnabled(),
                    user.getCreatedAt(),
                    roles,
                    permissions);
        }
    }

    public record AuthResponse(String token, UserProfile user) {
        public static AuthResponse of(User user, String token) {
            return new AuthResponse(token, UserProfile.from(user));
        }
    }
}

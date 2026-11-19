package com.hearth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserWriteRequest(
            @NotBlank @Size(min = 3, max = 80) String username,
            @NotBlank @Email String email,
            @Size(max = 100) String password,
            Boolean enabled,
            List<String> roles
    ) {
    }

    public record EnabledRequest(@NotNull Boolean enabled) {
    }
}

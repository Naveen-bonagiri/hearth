package com.hearth.web;

import com.hearth.security.CurrentUser;
import com.hearth.service.AuthService;
import com.hearth.web.dto.AuthDtos.AuthResponse;
import com.hearth.web.dto.AuthDtos.LoginRequest;
import com.hearth.web.dto.AuthDtos.ProfileUpdateRequest;
import com.hearth.web.dto.AuthDtos.RegisterRequest;
import com.hearth.web.dto.AuthDtos.UserProfile;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.authenticate(request);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @GetMapping("/me")
    public UserProfile me() {
        return authService.me(CurrentUser.username());
    }

    @PatchMapping("/me")
    public AuthResponse updateMe(@Valid @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(CurrentUser.username(), request);
    }
}

package com.hearth.service;

import com.hearth.domain.Role;
import com.hearth.domain.User;
import com.hearth.error.ApiException;
import com.hearth.repo.RoleRepository;
import com.hearth.repo.UserRepository;
import com.hearth.security.JwtService;
import com.hearth.web.dto.AuthDtos.AuthResponse;
import com.hearth.web.dto.AuthDtos.LoginRequest;
import com.hearth.web.dto.AuthDtos.ProfileUpdateRequest;
import com.hearth.web.dto.AuthDtos.RegisterRequest;
import com.hearth.web.dto.AuthDtos.UserProfile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class AuthService {

    private static final Set<String> LOGIN_ROLES = Set.of("CUSTOMER", "STAFF", "MANAGER", "ADMIN");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.username().trim())
                .orElseThrow(() -> new ApiException(401, "Invalid username or password."));
        if (!user.isEnabled()) {
            throw new ApiException(401, "This account is disabled.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(401, "Invalid username or password.");
        }
        String chosen = request.role().trim().toUpperCase();
        if (!LOGIN_ROLES.contains(chosen)) {
            throw new ApiException(400, "Choose Customer, Staff, Manager, or Admin.");
        }
        boolean matches = user.getRoles().stream().anyMatch(role -> chosen.equals(role.getName()));
        if (!matches) {
            throw new ApiException(401, "This account does not have the " + roleWord(chosen) + " role. Choose the role that matches the account.");
        }
        return AuthResponse.of(user, jwtService.generateToken(user));
    }

    @Transactional
    public AuthResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(401, "Sign in required."));
        if (!user.isEnabled()) {
            throw new ApiException(401, "This account is disabled.");
        }
        String name = request.name().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByUsernameAndIdNot(name, user.getId())) {
            throw new ApiException(409, "That name is already taken.");
        }
        if (userRepository.existsByEmailAndIdNot(email, user.getId())) {
            throw new ApiException(409, "That email is already registered.");
        }
        user.setUsername(name);
        user.setEmail(email);
        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 8) {
                throw new ApiException(400, "Password must be at least 8 characters.");
            }
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        userRepository.save(user);
        return AuthResponse.of(user, jwtService.generateToken(user));
    }

    private static String roleWord(String role) {
        return switch (role) {
            case "CUSTOMER" -> "Customer";
            case "STAFF" -> "Staff";
            case "MANAGER" -> "Manager";
            case "ADMIN" -> "Admin";
            default -> role;
        };
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new ApiException(409, "That username is already taken.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(409, "That email is already registered.");
        }
        Role customer = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new ApiException(500, "The customer role is not configured."));
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        user.getRoles().add(customer);
        userRepository.save(user);
        return AuthResponse.of(user, jwtService.generateToken(user));
    }

    @Transactional(readOnly = true)
    public UserProfile me(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(401, "Sign in required."));
        if (!user.isEnabled()) {
            throw new ApiException(401, "This account is disabled.");
        }
        return UserProfile.from(user);
    }
}

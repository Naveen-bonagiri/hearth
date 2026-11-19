package com.hearth.service;

import com.hearth.domain.Role;
import com.hearth.domain.User;
import com.hearth.error.ApiException;
import com.hearth.repo.OrderRepository;
import com.hearth.repo.RoleRepository;
import com.hearth.repo.UserRepository;
import com.hearth.security.CurrentUser;
import com.hearth.web.dto.AuthDtos.UserProfile;
import com.hearth.web.dto.UserDtos.UserWriteRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            OrderRepository orderRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserProfile> getUsers() {
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .filter(this::visibleToCaller)
                .map(UserProfile::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserProfile getUser(Long id) {
        User user = load(id);
        if (!visibleToCaller(user)) {
            throw new ApiException(403, "You can only manage staff accounts.");
        }
        return UserProfile.from(user);
    }

    @Transactional
    public UserProfile createUser(UserWriteRequest request) {
        if (request.password() == null || request.password().isBlank() || request.password().length() < 8) {
            throw new ApiException(400, "Password must be at least 8 characters.");
        }
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new ApiException(409, "That username is already taken.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(409, "That email is already registered.");
        }
        Set<Role> roles = resolveRoles(request.roles());
        assertCanAssign(roles);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(request.enabled() == null || request.enabled());
        user.setRoles(roles);
        return UserProfile.from(userRepository.save(user));
    }

    @Transactional
    public UserProfile updateUser(Long id, UserWriteRequest request) {
        User user = load(id);
        if (!visibleToCaller(user)) {
            throw new ApiException(403, "You can only manage staff accounts.");
        }
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new ApiException(409, "That username is already taken.");
        }
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new ApiException(409, "That email is already registered.");
        }
        Set<Role> roles = resolveRoles(request.roles() == null || request.roles().isEmpty()
                ? user.getRoles().stream().map(Role::getName).toList()
                : request.roles());
        assertCanAssign(roles);
        guardLastAdmin(user, request.enabled() == null ? user.isEnabled() : request.enabled(), roles);
        user.setUsername(username);
        user.setEmail(email);
        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 8) {
                throw new ApiException(400, "Password must be at least 8 characters.");
            }
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.enabled() != null) {
            if (!request.enabled() && user.getUsername().equals(CurrentUser.username())) {
                throw new ApiException(409, "You cannot disable your own account.");
            }
            user.setEnabled(request.enabled());
        }
        user.setRoles(roles);
        return UserProfile.from(user);
    }

    @Transactional
    public UserProfile setEnabled(Long id, boolean enabled) {
        User user = load(id);
        if (!visibleToCaller(user)) {
            throw new ApiException(403, "You can only manage staff accounts.");
        }
        if (!enabled && user.getUsername().equals(CurrentUser.username())) {
            throw new ApiException(409, "You cannot disable your own account.");
        }
        guardLastAdmin(user, enabled, user.getRoles());
        user.setEnabled(enabled);
        return UserProfile.from(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = load(id);
        if (!visibleToCaller(user)) {
            throw new ApiException(403, "You can only manage staff accounts.");
        }
        if (user.getUsername().equals(CurrentUser.username())) {
            throw new ApiException(409, "You cannot delete your own account.");
        }
        if (isAdmin(user) && countEnabledAdmins() <= 1) {
            throw new ApiException(409, "The house needs at least one enabled admin.");
        }
        if (orderRepository.existsByUser_Id(id)) {
            throw new ApiException(409, "This person has orders. Disable the account instead.");
        }
        user.getRoles().clear();
        userRepository.delete(user);
    }

    private User load(Long id) {
        return userRepository.findWithRolesById(id)
                .orElseThrow(() -> new ApiException(404, "That account does not exist."));
    }

    private boolean visibleToCaller(User user) {
        if (CurrentUser.hasAuthority("USER_MANAGE")) {
            return true;
        }
        return CurrentUser.hasAuthority("STAFF_MANAGE") && isStaffOnly(user);
    }

    private void assertCanAssign(Set<Role> roles) {
        if (roles.isEmpty()) {
            throw new ApiException(400, "Choose at least one role.");
        }
        if (CurrentUser.hasAuthority("USER_MANAGE")) {
            return;
        }
        if (CurrentUser.hasAuthority("STAFF_MANAGE") && roles.stream().allMatch(role -> "STAFF".equals(role.getName()))) {
            return;
        }
        throw new ApiException(403, "You can only manage staff accounts.");
    }

    private Set<Role> resolveRoles(List<String> names) {
        if (names == null || names.isEmpty()) {
            throw new ApiException(400, "Choose at least one role.");
        }
        Set<Role> roles = new HashSet<>();
        for (String name : names) {
            String normalized = name == null ? "" : name.trim().toUpperCase();
            Role role = roleRepository.findByName(normalized)
                    .orElseThrow(() -> new ApiException(400, "Unknown role: " + normalized));
            roles.add(role);
        }
        return roles;
    }

    private void guardLastAdmin(User user, boolean willBeEnabled, Set<Role> nextRoles) {
        boolean wasEnabledAdmin = user.isEnabled() && isAdmin(user);
        boolean staysEnabledAdmin = willBeEnabled && nextRoles.stream().anyMatch(role -> "ADMIN".equals(role.getName()));
        if (wasEnabledAdmin && !staysEnabledAdmin && countEnabledAdmins() <= 1) {
            throw new ApiException(409, "The house needs at least one enabled admin.");
        }
    }

    private long countEnabledAdmins() {
        return userRepository.findAllByOrderByUsernameAsc().stream()
                .filter(user -> user.isEnabled() && isAdmin(user))
                .count();
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()));
    }

    private boolean isStaffOnly(User user) {
        return !user.getRoles().isEmpty()
                && user.getRoles().stream().allMatch(role -> "STAFF".equals(role.getName()));
    }
}

package com.hearth.web;

import com.hearth.service.UserService;
import com.hearth.web.dto.AuthDtos.UserProfile;
import com.hearth.web.dto.UserDtos.EnabledRequest;
import com.hearth.web.dto.UserDtos.UserWriteRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAnyAuthority('USER_MANAGE','STAFF_MANAGE')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfile createUser(@Valid @RequestBody UserWriteRequest request) {
        return userService.createUser(request);
    }

    @GetMapping
    public List<UserProfile> getUsers() {
        return userService.getUsers();
    }

    @GetMapping("/{id}")
    public UserProfile getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PutMapping("/{id}")
    public UserProfile updateUser(@PathVariable Long id, @Valid @RequestBody UserWriteRequest request) {
        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/enabled")
    public UserProfile setEnabled(@PathVariable Long id, @Valid @RequestBody EnabledRequest request) {
        return userService.setEnabled(id, request.enabled());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}

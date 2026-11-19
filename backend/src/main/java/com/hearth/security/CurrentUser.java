package com.hearth.security;

import com.hearth.error.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static String username() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ApiException(401, "Sign in required.");
        }
        return authentication.getName();
    }

    public static boolean hasAuthority(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority granted : authentication.getAuthorities()) {
            if (authority.equals(granted.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    public static boolean hasRole(String role) {
        return hasAuthority("ROLE_" + role);
    }

    public static boolean isFloor() {
        return hasRole("STAFF") || hasRole("MANAGER") || hasRole("ADMIN");
    }
}

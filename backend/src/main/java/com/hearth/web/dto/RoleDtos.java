package com.hearth.web.dto;

import com.hearth.domain.Permission;
import com.hearth.domain.Role;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class RoleDtos {

    private RoleDtos() {
    }

    public record PermissionResponse(Long id, String name) {
        public static PermissionResponse from(Permission permission) {
            return new PermissionResponse(permission.getId(), permission.getName());
        }
    }

    public record RoleResponse(Long id, String name, List<PermissionResponse> permissions) {
        public static RoleResponse from(Role role) {
            List<PermissionResponse> permissions = role.getPermissions().stream()
                    .map(PermissionResponse::from)
                    .sorted((a, b) -> a.name().compareTo(b.name()))
                    .toList();
            return new RoleResponse(role.getId(), role.getName(), permissions);
        }
    }

    public record PermissionAssignRequest(@NotNull List<Long> permissionIds) {
    }
}

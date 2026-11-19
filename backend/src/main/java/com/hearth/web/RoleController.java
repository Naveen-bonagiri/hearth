package com.hearth.web;

import com.hearth.service.RoleService;
import com.hearth.web.dto.RoleDtos.PermissionAssignRequest;
import com.hearth.web.dto.RoleDtos.PermissionResponse;
import com.hearth.web.dto.RoleDtos.RoleResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping("/api/roles")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public List<RoleResponse> getRoles() {
        return roleService.getRoles();
    }

    @PutMapping("/api/roles/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public RoleResponse updatePermissions(@PathVariable Long id, @Valid @RequestBody PermissionAssignRequest request) {
        return roleService.updatePermissions(id, request);
    }

    @GetMapping("/api/permissions")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public List<PermissionResponse> getPermissions() {
        return roleService.getPermissions();
    }
}

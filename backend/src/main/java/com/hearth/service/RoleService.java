package com.hearth.service;

import com.hearth.domain.Permission;
import com.hearth.domain.Role;
import com.hearth.error.ApiException;
import com.hearth.repo.PermissionRepository;
import com.hearth.repo.RoleRepository;
import com.hearth.web.dto.RoleDtos.PermissionAssignRequest;
import com.hearth.web.dto.RoleDtos.PermissionResponse;
import com.hearth.web.dto.RoleDtos.RoleResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getRoles() {
        return roleRepository.findAllByOrderByNameAsc().stream().map(RoleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getPermissions() {
        return permissionRepository.findAllByOrderByNameAsc().stream().map(PermissionResponse::from).toList();
    }

    @Transactional
    public RoleResponse updatePermissions(Long id, PermissionAssignRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "That role does not exist."));
        List<Long> ids = request.permissionIds() == null ? List.of() : request.permissionIds().stream().distinct().toList();
        List<Permission> found = permissionRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            throw new ApiException(400, "One of those permissions does not exist.");
        }
        Set<String> names = new HashSet<>();
        for (Permission permission : found) {
            names.add(permission.getName());
        }
        if ("ADMIN".equals(role.getName()) && (!names.contains("USER_MANAGE") || !names.contains("ROLE_MANAGE"))) {
            throw new ApiException(409, "The admin role must keep user and role management.");
        }
        role.setPermissions(new HashSet<>(found));
        return RoleResponse.from(role);
    }
}

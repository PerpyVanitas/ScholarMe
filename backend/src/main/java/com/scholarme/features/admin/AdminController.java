package com.scholarme.features.admin;

import com.scholarme.features.admin.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.scholarme.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin Feature Controller
 * Administrative endpoints for system management
 */
@Tag(name = "Admin", description = "Administration endpoints")
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @Operation(summary = "Endpoint")

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats() {
        AdminStatsDto stats = adminService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @Operation(summary = "Endpoint")

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<AdminUserDto> users = adminService.getAllUsers(role, page, size);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @Operation(summary = "Endpoint")

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUserRole(
            @PathVariable UUID id,
            @RequestBody UpdateRoleRequest request) {
        try {
            AdminUserDto updated = adminService.updateUserRole(id, request.getRole());
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }

    @Operation(summary = "Endpoint")

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<String>> deactivateUser(@PathVariable UUID id) {
        adminService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deactivated"));
    }

    @Operation(summary = "Endpoint")

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<List<AnalyticsLogDto>>> getAnalytics(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<AnalyticsLogDto> logs = adminService.getAnalytics(type, page, size);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}

package com.scholarme.controller;

import com.scholarme.domain.enums.Role;
import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.auth.AuthDtos.*;
import com.scholarme.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Admin controller - User and credential management.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Administrative endpoints")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "Get all users with pagination")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search) {
        
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit, 100));
        Page<UserDto> users = adminService.getUsers(role, search, pageRequest);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/users")
    @Operation(summary = "Create a new user")
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @Valid @RequestBody RegisterRequest request) {
        UserDto user = adminService.createUser(request);
        return ResponseEntity.status(201).body(ApiResponse.success(user));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update user role")
    public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        Role role = Role.valueOf(request.get("role").toUpperCase());
        UserDto user = adminService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/credentials/issue")
    @Operation(summary = "Issue authentication card to user")
    public ResponseEntity<ApiResponse<Map<String, String>>> issueCredentials(
            @Valid @RequestBody RegisterCardRequest request) {
        adminService.issueCredentials(request);
        return ResponseEntity.status(201)
                .body(ApiResponse.success(Map.of("message", "Credentials issued successfully")));
    }

    @DeleteMapping("/credentials/{cardId}")
    @Operation(summary = "Revoke authentication card")
    public ResponseEntity<ApiResponse<Map<String, String>>> revokeCredentials(
            @PathVariable String cardId) {
        adminService.revokeCredentials(cardId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Credentials revoked")));
    }

    @GetMapping("/analytics/overview")
    @Operation(summary = "Get system analytics overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalyticsOverview() {
        Map<String, Object> analytics = adminService.getAnalyticsOverview();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}

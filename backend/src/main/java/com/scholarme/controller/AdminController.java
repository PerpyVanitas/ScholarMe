package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.entity.AuthCard;
import com.scholarme.entity.User;
import com.scholarme.service.AdminService;
import com.scholarme.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AnalyticsService analyticsService;

    /**
     * GET /admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers()));
    }

    /**
     * PUT /admin/users/{id}/role
     * Body: { "role": "tutor" }
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<User>> updateRole(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            User updated = adminService.updateUserRole(id, body.get("role"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALID-001", e.getMessage()));
        }
    }

    /**
     * POST /admin/credentials/issue
     * Body: { "userId": "uuid", "cardId": "string", "pin": "string" }
     */
    @PostMapping("/credentials/issue")
    public ResponseEntity<ApiResponse<AuthCard>> issueCard(@RequestBody Map<String, String> body) {
        try {
            UUID userId = UUID.fromString(body.get("userId"));
            AuthCard card = adminService.issueCard(userId, body.get("cardId"), body.get("pin"));
            return ResponseEntity.status(201).body(ApiResponse.ok(card));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }

    /**
     * PATCH /admin/credentials/{id}/revoke
     */
    @PatchMapping("/credentials/{id}/revoke")
    public ResponseEntity<ApiResponse<AuthCard>> revokeCard(@PathVariable UUID id) {
        AuthCard card = adminService.revokeCard(id);
        return ResponseEntity.ok(ApiResponse.ok(card));
    }

    /**
     * PATCH /admin/credentials/{id}/activate
     */
    @PatchMapping("/credentials/{id}/activate")
    public ResponseEntity<ApiResponse<AuthCard>> activateCard(@PathVariable UUID id) {
        AuthCard card = adminService.activateCard(id);
        return ResponseEntity.ok(ApiResponse.ok(card));
    }

    /**
     * GET /admin/cards
     */
    @GetMapping("/cards")
    public ResponseEntity<ApiResponse<List<AuthCard>>> getAllCards() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllCards()));
    }

    /**
     * GET /admin/analytics/dashboard
     */
    @GetMapping("/analytics/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDashboardStats()));
    }
}

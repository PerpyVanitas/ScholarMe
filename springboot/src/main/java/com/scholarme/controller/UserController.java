package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.auth.AuthDtos.*;
import com.scholarme.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * User controller - Profile management and device tokens.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and device management")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal String userId) {
        UserDto user = userService.getUserById(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDto user = userService.updateProfile(UUID.fromString(userId), request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/me/change-password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(UUID.fromString(userId), request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Password changed successfully")));
    }

    @PostMapping("/{id}/device-token")
    @Operation(summary = "Register device token for push notifications")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerDeviceToken(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        // Verify user is updating their own device token
        if (!id.toString().equals(userId)) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("AUTH-003", "Access denied"));
        }
        
        userService.registerDeviceToken(id, request.get("deviceType"), request.get("token"));
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Device token registered successfully")));
    }
}

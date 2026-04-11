package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.UserDtos.*;
import com.scholarme.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /users/me
     * Headers: Authorization: Bearer {token}
     * Response: { user profile data }
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            UserProfileDto profile = userService.getProfile(userId);
            return ResponseEntity.ok(ApiResponse.ok(profile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("DB-001", "User not found", e.getMessage()));
        }
    }

    /**
     * PUT /users/me
     * Headers: Authorization: Bearer {token}
     * Body: { fullName, phone, bio, degreeProgram, yearLevel }
     * Response: { updated user profile }
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            UserProfileDto profile = userService.updateProfile(userId, request);
            return ResponseEntity.ok(ApiResponse.ok(profile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALID-001", "Update failed", e.getMessage()));
        }
    }

    /**
     * POST /users/me/change-password
     * Headers: Authorization: Bearer {token}
     * Body: { currentPassword, newPassword }
     * Response: { message }
     */
    @PostMapping("/me/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            userService.changePassword(userId, request);
            return ResponseEntity.ok(ApiResponse.ok("Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("AUTH-001", "Password change failed", e.getMessage()));
        }
    }

    /**
     * POST /users/{id}/device-token
     * Headers: Authorization: Bearer {token}
     * Body: { deviceType, token }
     * Response: { message }
     */
    @PostMapping("/{id}/device-token")
    public ResponseEntity<ApiResponse<String>> registerDeviceToken(
            @PathVariable UUID id,
            @Valid @RequestBody DeviceTokenRequest request) {
        try {
            userService.registerDeviceToken(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Device token registered successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALID-001", "Device token registration failed", e.getMessage()));
        }
    }
}

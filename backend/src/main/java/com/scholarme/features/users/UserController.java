package com.scholarme.features.users;

import com.scholarme.features.users.dto.*;
import com.scholarme.shared.dto.ApiResponse;
import com.scholarme.shared.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Users Feature Controller
 * Handles user profile management
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile(
            @AuthenticationPrincipal User user) {
        UserProfileDto profile = userService.getProfile(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            UserProfileDto updated = userService.updateProfile(user.getId(), request);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALID-001", e.getMessage()));
        }
    }



    @PostMapping("/me/device-token")
    public ResponseEntity<ApiResponse<String>> registerDeviceToken(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DeviceTokenRequest request) {
        userService.registerDeviceToken(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Device token registered"));
    }
}

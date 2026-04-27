package com.scholarme.features.notifications;

import com.scholarme.features.notifications.dto.*;
import com.scholarme.shared.dto.ApiResponse;
import com.scholarme.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Notifications Feature Controller
 * Handles user notification management
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        List<NotificationDto> notifications = notificationService.getNotifications(user.getId(), unreadOnly);
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        try {
            NotificationDto notification = notificationService.markAsRead(user.getId(), id);
            return ResponseEntity.ok(ApiResponse.ok(notification));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("NOT-001", e.getMessage()));
        }
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<NotificationCountDto>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        int count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(new NotificationCountDto(count)));
    }
}

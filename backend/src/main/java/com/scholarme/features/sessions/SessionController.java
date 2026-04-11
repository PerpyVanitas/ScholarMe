package com.scholarme.features.sessions;

import com.scholarme.features.sessions.dto.*;
import com.scholarme.shared.dto.ApiResponse;
import com.scholarme.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

/**
 * Sessions Feature Controller
 * Handles all session-related endpoints
 */
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<ApiResponse<SessionListResponse>> getSessions(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status) {
        List<SessionDto> sessions = sessionService.getSessionsForUser(user, status);
        return ResponseEntity.ok(ApiResponse.ok(new SessionListResponse(sessions)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SessionDto>> createSession(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateSessionRequest request) {
        try {
            SessionDto session = sessionService.createSession(user.getId(), request);
            return ResponseEntity.status(201).body(ApiResponse.ok(session));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<SessionDto>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request) {
        try {
            SessionDto updated = sessionService.updateStatus(id, request.getStatus());
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<ApiResponse<SessionRatingDto>> rateSession(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody RateSessionRequest request) {
        try {
            SessionRatingDto rating = sessionService.rateSession(id, user.getId(), request);
            return ResponseEntity.status(201).body(ApiResponse.ok(rating));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }
}

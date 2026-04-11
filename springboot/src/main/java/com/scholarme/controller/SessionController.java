package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.session.SessionDtos.*;
import com.scholarme.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Session controller - Book and manage tutoring sessions.
 */
@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions", description = "Session booking and management")
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    @Operation(summary = "Get user's sessions")
    public ResponseEntity<ApiResponse<Page<SessionDto>>> getSessions(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String role) {
        
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit, 100));
        Page<SessionDto> sessions = sessionService.getUserSessions(
                UUID.fromString(userId), role, pageRequest);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session by ID")
    public ResponseEntity<ApiResponse<SessionDto>> getSession(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id) {
        SessionDto session = sessionService.getSessionById(id, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping
    @Operation(summary = "Book a new session")
    public ResponseEntity<ApiResponse<SessionDto>> createSession(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateSessionRequest request) {
        SessionDto session = sessionService.createSession(UUID.fromString(userId), request);
        return ResponseEntity.status(201).body(ApiResponse.success(session));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update session status (confirm/cancel/complete)")
    public ResponseEntity<ApiResponse<SessionDto>> updateSessionStatus(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSessionStatusRequest request) {
        SessionDto session = sessionService.updateSessionStatus(
                id, UUID.fromString(userId), request);
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping("/{id}/rate")
    @Operation(summary = "Rate a completed session")
    public ResponseEntity<ApiResponse<Map<String, String>>> rateSession(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id,
            @Valid @RequestBody RateSessionRequest request) {
        sessionService.rateSession(id, UUID.fromString(userId), request);
        return ResponseEntity.status(201)
                .body(ApiResponse.success(Map.of("message", "Rating submitted successfully")));
    }
}

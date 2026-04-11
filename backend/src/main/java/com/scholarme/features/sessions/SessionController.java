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
 * Sessions Controller (Sessions Feature)
 * 
 * Manages tutoring session lifecycle:
 * - List sessions for current user (learner or tutor view)
 * - Create new session requests
 * - Update session status (confirm, cancel, complete)
 * - Submit post-session ratings
 * 
 * Access Control:
 * - All authenticated users can list and create sessions
 * - Only tutors/admins can update session status
 * 
 * @see SessionService for business logic
 */
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * Lists sessions for the authenticated user.
     * Returns different views based on user role (learner sees their bookings, tutor sees their schedule).
     * 
     * @param user Authenticated user from JWT
     * @param status Optional filter: "scheduled", "confirmed", "completed", "cancelled"
     * @return List of session DTOs
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SessionListResponse>> getSessions(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status) {
        List<SessionDto> sessions = sessionService.getSessionsForUser(user, status);
        return ResponseEntity.ok(ApiResponse.ok(new SessionListResponse(sessions)));
    }

    /**
     * Creates a new tutoring session request.
     * Session starts in "scheduled" status pending tutor confirmation.
     * 
     * @param user Authenticated learner creating the session
     * @param request Session details (tutor ID, time slot, topic, etc.)
     * @return Created session DTO with generated ID
     */
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

    /**
     * Updates session status (confirm, cancel, or complete).
     * Restricted to tutors and administrators.
     * 
     * Valid transitions: scheduled -> confirmed -> completed
     *                   scheduled -> cancelled
     *                   confirmed -> cancelled
     * 
     * @param id Session UUID
     * @param request New status value
     * @return Updated session DTO
     */
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

    /**
     * Submits a rating for a completed session.
     * Only the learner who attended the session can submit a rating.
     * 
     * @param user Authenticated learner submitting the rating
     * @param id Session UUID (must be in "completed" status)
     * @param request Rating (1-5 stars) and optional comment
     * @return Created rating DTO
     */
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

package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.entity.Session;
import com.scholarme.entity.SessionRating;
import com.scholarme.entity.User;
import com.scholarme.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * GET /sessions (returns sessions based on role)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<Session>>>> getSessions(
            @AuthenticationPrincipal User user) {
        String role = user.getRole().getName();
        List<Session> sessions;

        if ("administrator".equals(role)) {
            sessions = sessionService.getAllSessions();
        } else {
            sessions = sessionService.getSessionsByLearner(user.getId());
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("sessions", sessions)));
    }

    /**
     * POST /sessions
     * Body: { tutorId, learnerId, scheduledDate, startTime, endTime, specializationId, notes }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Session>> createSession(
            @AuthenticationPrincipal User user,
            @RequestBody Session session) {
        try {
            UUID tutorId = session.getTutor() != null ? session.getTutor().getId() : null;
            if (tutorId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("VALID-001", "Tutor ID is required"));
            }
            Session created = sessionService.createSession(user.getId(), tutorId, session);
            return ResponseEntity.status(201).body(ApiResponse.ok(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }

    /**
     * PATCH /sessions/{id}/status
     * Body: { "status": "confirmed|completed|cancelled" }
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Session>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            Session updated = sessionService.updateStatus(id, body.get("status"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }

    /**
     * POST /sessions/{id}/rating
     * Body: { "rating": 1-5, "feedback": "optional text" }
     */
    @PostMapping("/{id}/rating")
    public ResponseEntity<ApiResponse<SessionRating>> rateSession(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        try {
            int rating = (Integer) body.get("rating");
            String feedback = (String) body.getOrDefault("feedback", null);
            SessionRating sessionRating = sessionService.rateSession(id, user.getId(), rating, feedback);
            return ResponseEntity.status(201).body(ApiResponse.ok(sessionRating));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BUS-001", e.getMessage()));
        }
    }
}

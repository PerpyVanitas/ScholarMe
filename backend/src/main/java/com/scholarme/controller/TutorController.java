package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.entity.Tutor;
import com.scholarme.entity.TutorAvailability;
import com.scholarme.entity.User;
import com.scholarme.service.TutorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService tutorService;

    /**
     * GET /tutors?page=1&limit=20&search=keyword&specialization=math
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTutors(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String specialization) {

        Page<Tutor> tutors = tutorService.findTutors(search, specialization, page, limit);

        Map<String, Object> data = new HashMap<>();
        data.put("tutors", tutors.getContent());
        data.put("pagination", Map.of(
                "page", tutors.getNumber() + 1,
                "limit", tutors.getSize(),
                "total", tutors.getTotalElements(),
                "pages", tutors.getTotalPages()
        ));

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /**
     * GET /tutors/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Tutor>> getTutor(@PathVariable UUID id) {
        try {
            Tutor tutor = tutorService.findById(id);
            return ResponseEntity.ok(ApiResponse.ok(tutor));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("DB-001", e.getMessage()));
        }
    }

    /**
     * GET /tutors/{id}/availability (public)
     */
    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<TutorAvailability>>> getAvailability(@PathVariable UUID id) {
        List<TutorAvailability> slots = tutorService.getAvailability(id);
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    /**
     * POST /tutors/me/availability (tutor only)
     */
    @PostMapping("/me/availability")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<TutorAvailability>> addAvailability(
            @AuthenticationPrincipal User user,
            @RequestBody TutorAvailability slot) {
        Tutor tutor = tutorService.findByUserId(user.getId());
        TutorAvailability saved = tutorService.addAvailability(tutor.getId(), slot);
        return ResponseEntity.status(201).body(ApiResponse.ok(saved));
    }

    /**
     * DELETE /tutors/me/availability/{slotId}
     */
    @DeleteMapping("/me/availability/{slotId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<String>> deleteAvailability(@PathVariable UUID slotId) {
        tutorService.deleteAvailability(slotId);
        return ResponseEntity.ok(ApiResponse.ok("Availability slot removed"));
    }

    /**
     * PATCH /tutors/me/bio
     */
    @PatchMapping("/me/bio")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<Tutor>> updateBio(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        Tutor tutor = tutorService.findByUserId(user.getId());
        Tutor updated = tutorService.updateBio(tutor.getId(), body.get("bio"));
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}

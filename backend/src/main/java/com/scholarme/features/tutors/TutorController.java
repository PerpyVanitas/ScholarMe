package com.scholarme.features.tutors;

import com.scholarme.features.tutors.dto.*;
import com.scholarme.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Tutors Feature Controller
 * Public and authenticated endpoints for tutor browsing
 */
@RestController
@RequestMapping("/api/v1/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService tutorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TutorDto>>> getAllTutors(
            @RequestParam(required = false) UUID specializationId,
            @RequestParam(required = false) Boolean available) {
        List<TutorDto> tutors = tutorService.getAllTutors(specializationId, available);
        return ResponseEntity.ok(ApiResponse.ok(tutors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TutorDto>> getTutor(@PathVariable UUID id) {
        try {
            TutorDto tutor = tutorService.getTutorById(id);
            return ResponseEntity.ok(ApiResponse.ok(tutor));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("NOT-001", "Tutor not found"));
        }
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<TutorAvailabilityDto>>> getAvailability(
            @PathVariable UUID id) {
        List<TutorAvailabilityDto> availability = tutorService.getTutorAvailability(id);
        return ResponseEntity.ok(ApiResponse.ok(availability));
    }
}

package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.tutor.TutorDtos.*;
import com.scholarme.service.TutorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Tutor controller - Browse tutors and manage availability.
 */
@RestController
@RequestMapping("/tutors")
@RequiredArgsConstructor
@Tag(name = "Tutors", description = "Tutor browsing and availability management")
public class TutorController {

    private final TutorService tutorService;

    @GetMapping
    @Operation(summary = "Get list of tutors with pagination and filtering")
    public ResponseEntity<ApiResponse<TutorListResponse>> getTutors(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID specialization) {
        
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit, 100));
        TutorListResponse response = tutorService.getTutors(pageRequest, search, specialization);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tutor details by ID")
    public ResponseEntity<ApiResponse<TutorDto>> getTutor(@PathVariable UUID id) {
        TutorDto tutor = tutorService.getTutorById(id);
        return ResponseEntity.ok(ApiResponse.success(tutor));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Get tutor availability schedule")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> getTutorAvailability(
            @PathVariable UUID id) {
        List<AvailabilityDto> availability = tutorService.getTutorAvailability(id);
        return ResponseEntity.ok(ApiResponse.success(availability));
    }

    @PostMapping("/availability")
    @Operation(summary = "Update tutor availability (Tutor only)")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> updateAvailability(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody List<UpdateAvailabilityRequest> request) {
        List<AvailabilityDto> availability = tutorService.updateAvailability(
                UUID.fromString(userId), request);
        return ResponseEntity.ok(ApiResponse.success(availability));
    }
}

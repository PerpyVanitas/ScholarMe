package com.scholarme.controller;

import com.scholarme.domain.entity.Specialization;
import com.scholarme.domain.repository.SpecializationRepository;
import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.tutor.TutorDtos.SpecializationDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Specialization controller - Browse available specializations.
 */
@RestController
@RequestMapping("/specializations")
@RequiredArgsConstructor
@Tag(name = "Specializations", description = "Browse tutoring specializations")
public class SpecializationController {

    private final SpecializationRepository specializationRepository;

    @GetMapping
    @Operation(summary = "Get all specializations")
    public ResponseEntity<ApiResponse<List<SpecializationDto>>> getSpecializations() {
        List<SpecializationDto> specializations = specializationRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(specializations));
    }

    private SpecializationDto mapToDto(Specialization s) {
        return SpecializationDto.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .category(s.getCategory())
                .build();
    }
}

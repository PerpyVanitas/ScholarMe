package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.entity.Specialization;
import com.scholarme.repository.SpecializationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/specializations")
@RequiredArgsConstructor
public class SpecializationController {

    private final SpecializationRepository specializationRepository;

    /**
     * GET /specializations (public)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Specialization>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(specializationRepository.findAll()));
    }
}

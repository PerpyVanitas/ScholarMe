package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.repository.RepositoryDtos.*;
import com.scholarme.service.RepositoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Repository controller - Resource repository management.
 */
@RestController
@RequestMapping("/repositories")
@RequiredArgsConstructor
@Tag(name = "Repositories", description = "Resource repository management")
public class RepositoryController {

    private final RepositoryService repositoryService;

    @GetMapping
    @Operation(summary = "Get accessible repositories")
    public ResponseEntity<ApiResponse<RepositoryListResponse>> getRepositories(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search) {
        
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit, 100));
        RepositoryListResponse response = repositoryService.getRepositories(
                UUID.fromString(userId), search, pageRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get repository by ID")
    public ResponseEntity<ApiResponse<RepositoryDto>> getRepository(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id) {
        RepositoryDto repository = repositoryService.getRepositoryById(id, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(repository));
    }

    @PostMapping
    @Operation(summary = "Create a new repository")
    public ResponseEntity<ApiResponse<RepositoryDto>> createRepository(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateRepositoryRequest request) {
        RepositoryDto repository = repositoryService.createRepository(
                UUID.fromString(userId), request);
        return ResponseEntity.status(201).body(ApiResponse.success(repository));
    }

    @GetMapping("/{id}/resources")
    @Operation(summary = "Get resources in a repository")
    public ResponseEntity<ApiResponse<ResourceListResponse>> getResources(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {
        
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(limit, 100));
        ResourceListResponse response = repositoryService.getResources(
                id, UUID.fromString(userId), pageRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/resources")
    @Operation(summary = "Add a resource to repository")
    public ResponseEntity<ApiResponse<ResourceDto>> addResource(
            @AuthenticationPrincipal String userId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateResourceRequest request) {
        ResourceDto resource = repositoryService.addResource(
                id, UUID.fromString(userId), request);
        return ResponseEntity.status(201).body(ApiResponse.success(resource));
    }
}

package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.entity.Repository;
import com.scholarme.entity.Resource;
import com.scholarme.entity.User;
import com.scholarme.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/repositories")
@RequiredArgsConstructor
public class RepositoryController {

    private final RepositoryService repositoryService;

    /**
     * GET /repositories
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<Repository>>>> getRepositories(
            @AuthenticationPrincipal User user) {
        String role = user.getRole().getName();
        List<Repository> repos = repositoryService.getAccessible(user.getId(), role);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("repositories", repos)));
    }

    /**
     * POST /repositories
     * Body: { title, description, accessRole }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Repository>> createRepository(
            @AuthenticationPrincipal User user,
            @RequestBody Repository repo) {
        Repository created = repositoryService.createRepository(user.getId(), repo);
        return ResponseEntity.status(201).body(ApiResponse.ok(created));
    }

    /**
     * GET /repositories/{id}/resources
     */
    @GetMapping("/{id}/resources")
    public ResponseEntity<ApiResponse<Map<String, List<Resource>>>> getResources(@PathVariable UUID id) {
        List<Resource> resources = repositoryService.getResources(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("resources", resources)));
    }

    /**
     * POST /repositories/{id}/resources
     * Body: { title, url, description, fileType }
     */
    @PostMapping("/{id}/resources")
    public ResponseEntity<ApiResponse<Resource>> addResource(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody Resource resource) {
        Resource created = repositoryService.addResource(id, user.getId(), resource);
        return ResponseEntity.status(201).body(ApiResponse.ok(created));
    }

    /**
     * DELETE /repositories/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteRepository(@PathVariable UUID id) {
        repositoryService.deleteRepository(id);
        return ResponseEntity.ok(ApiResponse.ok("Repository deleted"));
    }

    /**
     * DELETE /repositories/{repoId}/resources/{resourceId}
     */
    @DeleteMapping("/{repoId}/resources/{resourceId}")
    public ResponseEntity<ApiResponse<String>> deleteResource(
            @PathVariable UUID repoId,
            @PathVariable UUID resourceId) {
        repositoryService.deleteResource(resourceId);
        return ResponseEntity.ok(ApiResponse.ok("Resource deleted"));
    }
}

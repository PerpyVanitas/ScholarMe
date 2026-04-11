package com.scholarme.dto.repository;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository and Resource related DTOs.
 */
public class RepositoryDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRepositoryRequest {
        @NotBlank(message = "Title is required")
        private String title;

        private String description;
        private String visibility; // public, private, shared
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepositoryDto {
        private UUID id;
        private String title;
        private String description;
        private String visibility;
        private UUID ownerId;
        private String ownerName;
        private Long resourceCount;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateResourceRequest {
        @NotBlank(message = "Title is required")
        private String title;

        private String description;
        private String url;
        private String fileType;
        private Long fileSize;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceDto {
        private UUID id;
        private String title;
        private String description;
        private String url;
        private String fileType;
        private Long fileSize;
        private UUID uploadedById;
        private String uploadedByName;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepositoryListResponse {
        private List<RepositoryDto> repositories;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceListResponse {
        private List<ResourceDto> resources;
    }
}

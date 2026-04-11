package com.scholarme.service;

import com.scholarme.domain.entity.Repository;
import com.scholarme.domain.entity.Resource;
import com.scholarme.domain.entity.User;
import com.scholarme.domain.repository.RepositoryRepository;
import com.scholarme.domain.repository.ResourceRepository;
import com.scholarme.domain.repository.UserRepository;
import com.scholarme.dto.repository.RepositoryDtos.*;
import com.scholarme.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Repository service - manages resource repositories.
 */
@Service
@RequiredArgsConstructor
public class RepositoryService {

    private final RepositoryRepository repositoryRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public RepositoryListResponse getRepositories(UUID userId, String search, Pageable pageable) {
        Page<Repository> repos;

        if (search != null && !search.isBlank()) {
            repos = repositoryRepository.searchRepositories(userId, search, pageable);
        } else {
            repos = repositoryRepository.findAccessibleRepositories(userId, pageable);
        }

        return RepositoryListResponse.builder()
                .repositories(repos.getContent().stream()
                        .map(this::mapToRepositoryDto)
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public RepositoryDto getRepositoryById(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findById(repoId)
                .orElseThrow(() -> new ApiException("DB-001", "Repository not found"));

        // Check access
        if (!"public".equals(repo.getVisibility()) && !repo.getOwner().getId().equals(userId)) {
            throw new ApiException("AUTH-003", "Access denied");
        }

        return mapToRepositoryDto(repo);
    }

    @Transactional
    public RepositoryDto createRepository(UUID userId, CreateRepositoryRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        Repository repo = Repository.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .visibility(request.getVisibility() != null ? request.getVisibility() : "private")
                .owner(owner)
                .build();

        repositoryRepository.save(repo);
        return mapToRepositoryDto(repo);
    }

    @Transactional(readOnly = true)
    public ResourceListResponse getResources(UUID repoId, UUID userId, Pageable pageable) {
        Repository repo = repositoryRepository.findById(repoId)
                .orElseThrow(() -> new ApiException("DB-001", "Repository not found"));

        // Check access
        if (!"public".equals(repo.getVisibility()) && !repo.getOwner().getId().equals(userId)) {
            throw new ApiException("AUTH-003", "Access denied");
        }

        Page<Resource> resources = resourceRepository.findByRepositoryId(repoId, pageable);

        return ResourceListResponse.builder()
                .resources(resources.getContent().stream()
                        .map(this::mapToResourceDto)
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public ResourceDto addResource(UUID repoId, UUID userId, CreateResourceRequest request) {
        Repository repo = repositoryRepository.findById(repoId)
                .orElseThrow(() -> new ApiException("DB-001", "Repository not found"));

        // Only owner can add resources
        if (!repo.getOwner().getId().equals(userId)) {
            throw new ApiException("AUTH-003", "Only repository owner can add resources");
        }

        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        Resource resource = Resource.builder()
                .repository(repo)
                .uploadedBy(uploader)
                .title(request.getTitle())
                .description(request.getDescription())
                .url(request.getUrl())
                .fileType(request.getFileType())
                .fileSize(request.getFileSize())
                .build();

        resourceRepository.save(resource);
        return mapToResourceDto(resource);
    }

    private RepositoryDto mapToRepositoryDto(Repository r) {
        return RepositoryDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .visibility(r.getVisibility())
                .ownerId(r.getOwner().getId())
                .ownerName(r.getOwner().getFullName())
                .resourceCount(resourceRepository.countByRepositoryId(r.getId()))
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private ResourceDto mapToResourceDto(Resource r) {
        return ResourceDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .url(r.getUrl())
                .fileType(r.getFileType())
                .fileSize(r.getFileSize())
                .uploadedById(r.getUploadedBy().getId())
                .uploadedByName(r.getUploadedBy().getFullName())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

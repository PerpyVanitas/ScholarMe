package com.scholarme.service;

import com.scholarme.entity.Repository;
import com.scholarme.entity.Resource;
import com.scholarme.entity.User;
import com.scholarme.repository.RepositoryRepository;
import com.scholarme.repository.ResourceRepository;
import com.scholarme.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RepositoryService {

    private final RepositoryRepository repositoryRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public List<Repository> getAccessible(UUID userId, String role) {
        return repositoryRepository.findAccessible(role, userId);
    }

    public Repository createRepository(UUID ownerId, Repository repo) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        repo.setOwner(owner);
        return repositoryRepository.save(repo);
    }

    public Repository findById(UUID id) {
        return repositoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Repository not found"));
    }

    public List<Resource> getResources(UUID repositoryId) {
        return resourceRepository.findByRepositoryId(repositoryId);
    }

    public Resource addResource(UUID repositoryId, UUID uploadedById, Resource resource) {
        Repository repo = findById(repositoryId);
        User uploader = userRepository.findById(uploadedById)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        resource.setRepository(repo);
        resource.setUploadedBy(uploader);
        return resourceRepository.save(resource);
    }

    public void deleteResource(UUID resourceId) {
        resourceRepository.deleteById(resourceId);
    }

    public void deleteRepository(UUID repoId) {
        repositoryRepository.deleteById(repoId);
    }
}

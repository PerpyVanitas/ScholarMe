package com.scholarme.repository;

import com.scholarme.entity.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RepositoryRepository extends JpaRepository<Repository, UUID> {
    List<Repository> findByOwnerId(UUID ownerId);

    @Query("SELECT r FROM Repository r WHERE r.accessRole = 'all' OR r.accessRole = :role OR r.owner.id = :userId")
    List<Repository> findAccessible(String role, UUID userId);
}

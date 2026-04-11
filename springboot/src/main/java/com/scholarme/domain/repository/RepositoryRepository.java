package com.scholarme.domain.repository;

import com.scholarme.domain.entity.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

@org.springframework.stereotype.Repository
public interface RepositoryRepository extends JpaRepository<Repository, UUID> {

    Page<Repository> findByOwnerId(UUID ownerId, Pageable pageable);

    @Query("SELECT r FROM Repository r WHERE r.visibility = 'public' OR r.owner.id = :userId")
    Page<Repository> findAccessibleRepositories(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT r FROM Repository r WHERE " +
           "(r.visibility = 'public' OR r.owner.id = :userId) AND " +
           "(LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Repository> searchRepositories(@Param("userId") UUID userId, 
                                         @Param("search") String search, 
                                         Pageable pageable);
}

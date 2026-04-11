package com.scholarme.domain.repository;

import com.scholarme.domain.entity.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    Page<Resource> findByRepositoryId(UUID repositoryId, Pageable pageable);

    long countByRepositoryId(UUID repositoryId);
}

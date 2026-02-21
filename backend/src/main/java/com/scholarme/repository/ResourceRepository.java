package com.scholarme.repository;

import com.scholarme.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {
    List<Resource> findByRepositoryId(UUID repositoryId);
}

package com.scholarme.domain.repository;

import com.scholarme.domain.entity.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, UUID> {

    Optional<Specialization> findByName(String name);

    boolean existsByName(String name);
}

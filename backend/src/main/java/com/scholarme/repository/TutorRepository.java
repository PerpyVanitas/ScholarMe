package com.scholarme.repository;

import com.scholarme.entity.Tutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface TutorRepository extends JpaRepository<Tutor, UUID> {
    Optional<Tutor> findByUserId(UUID userId);

    @Query("SELECT t FROM Tutor t JOIN t.user u LEFT JOIN t.specializations s " +
           "WHERE (:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:specialization IS NULL OR LOWER(s.name) = LOWER(:specialization))")
    Page<Tutor> findWithFilters(String search, String specialization, Pageable pageable);
}

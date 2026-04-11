package com.scholarme.domain.repository;

import com.scholarme.domain.entity.TutorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TutorProfileRepository extends JpaRepository<TutorProfile, UUID> {

    Optional<TutorProfile> findByUserId(UUID userId);

    @Query("SELECT tp FROM TutorProfile tp JOIN FETCH tp.user u " +
           "LEFT JOIN FETCH tp.specializations WHERE tp.isAvailable = true")
    Page<TutorProfile> findAvailableTutors(Pageable pageable);

    @Query("SELECT tp FROM TutorProfile tp JOIN FETCH tp.user u " +
           "LEFT JOIN FETCH tp.specializations s " +
           "WHERE tp.isAvailable = true AND s.id = :specializationId")
    Page<TutorProfile> findBySpecialization(@Param("specializationId") UUID specializationId, 
                                             Pageable pageable);

    @Query("SELECT tp FROM TutorProfile tp JOIN FETCH tp.user u " +
           "LEFT JOIN FETCH tp.specializations " +
           "WHERE tp.isAvailable = true AND " +
           "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.degreeProgram) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<TutorProfile> searchTutors(@Param("search") String search, Pageable pageable);
}

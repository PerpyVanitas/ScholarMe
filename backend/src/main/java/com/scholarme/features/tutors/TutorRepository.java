package com.scholarme.features.tutors;

import com.scholarme.shared.entity.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, UUID> {
    List<Tutor> findByIsAvailableTrue();
}

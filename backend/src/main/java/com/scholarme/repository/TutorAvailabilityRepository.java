package com.scholarme.repository;

import com.scholarme.entity.TutorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TutorAvailabilityRepository extends JpaRepository<TutorAvailability, UUID> {
    List<TutorAvailability> findByTutorId(UUID tutorId);
    void deleteByTutorIdAndDayOfWeek(UUID tutorId, Integer dayOfWeek);
}

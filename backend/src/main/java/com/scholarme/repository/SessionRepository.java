package com.scholarme.repository;

import com.scholarme.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findByLearnerId(UUID learnerId);
    List<Session> findByTutorId(UUID tutorId);
    List<Session> findByTutorIdAndStatus(UUID tutorId, String status);
}

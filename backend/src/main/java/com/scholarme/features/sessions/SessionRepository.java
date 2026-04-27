package com.scholarme.features.sessions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findByLearnerId(UUID learnerId);
    List<Session> findByTutorId(UUID tutorId);
    List<Session> findByTutorIdAndStatus(UUID tutorId, String status);
    List<Session> findByLearnerIdAndStatus(UUID learnerId, String status);
    List<Session> findByStatus(String status);
    
    // Count methods for dashboard statistics
    int countByLearnerIdOrTutorId(UUID learnerId, UUID tutorId);
    int countByTutorIdAndStatus(UUID tutorId, String status);
    int countByLearnerIdAndStatus(UUID learnerId, String status);
}

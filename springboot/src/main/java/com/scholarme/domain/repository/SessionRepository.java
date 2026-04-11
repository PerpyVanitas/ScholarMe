package com.scholarme.domain.repository;

import com.scholarme.domain.entity.Session;
import com.scholarme.domain.enums.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    @Query("SELECT s FROM Session s JOIN FETCH s.tutor JOIN FETCH s.learner " +
           "WHERE s.tutor.id = :tutorId ORDER BY s.scheduledAt DESC")
    Page<Session> findByTutorId(@Param("tutorId") UUID tutorId, Pageable pageable);

    @Query("SELECT s FROM Session s JOIN FETCH s.tutor JOIN FETCH s.learner " +
           "WHERE s.learner.id = :learnerId ORDER BY s.scheduledAt DESC")
    Page<Session> findByLearnerId(@Param("learnerId") UUID learnerId, Pageable pageable);

    @Query("SELECT s FROM Session s WHERE s.tutor.id = :tutorId AND s.status = :status")
    List<Session> findByTutorIdAndStatus(@Param("tutorId") UUID tutorId, 
                                          @Param("status") SessionStatus status);

    @Query("SELECT s FROM Session s WHERE s.tutor.id = :tutorId " +
           "AND s.scheduledAt BETWEEN :start AND :end AND s.status != 'CANCELLED'")
    List<Session> findConflictingSessions(@Param("tutorId") UUID tutorId,
                                           @Param("start") Instant start,
                                           @Param("end") Instant end);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.tutor.id = :tutorId AND s.status = :status")
    long countByTutorIdAndStatus(@Param("tutorId") UUID tutorId, 
                                  @Param("status") SessionStatus status);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.learner.id = :learnerId AND s.status = :status")
    long countByLearnerIdAndStatus(@Param("learnerId") UUID learnerId, 
                                    @Param("status") SessionStatus status);

    Page<Session> findByStatus(SessionStatus status, Pageable pageable);
}

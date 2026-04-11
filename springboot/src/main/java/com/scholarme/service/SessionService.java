package com.scholarme.service;

import com.scholarme.domain.entity.Session;
import com.scholarme.domain.entity.SessionRating;
import com.scholarme.domain.entity.User;
import com.scholarme.domain.enums.Role;
import com.scholarme.domain.enums.SessionStatus;
import com.scholarme.domain.repository.SessionRepository;
import com.scholarme.domain.repository.SpecializationRepository;
import com.scholarme.domain.repository.UserRepository;
import com.scholarme.dto.session.SessionDtos.*;
import com.scholarme.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Session service - manages tutoring session booking and lifecycle.
 */
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SpecializationRepository specializationRepository;

    @Transactional(readOnly = true)
    public Page<SessionDto> getUserSessions(UUID userId, String role, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        Page<Session> sessions;
        if (user.getRole() == Role.TUTOR || "tutor".equalsIgnoreCase(role)) {
            sessions = sessionRepository.findByTutorId(userId, pageable);
        } else {
            sessions = sessionRepository.findByLearnerId(userId, pageable);
        }

        return sessions.map(this::mapToSessionDto);
    }

    @Transactional(readOnly = true)
    public SessionDto getSessionById(UUID sessionId, UUID userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("DB-001", "Session not found"));

        // Verify user has access
        if (!session.getTutor().getId().equals(userId) && 
            !session.getLearner().getId().equals(userId)) {
            throw new ApiException("AUTH-003", "Access denied");
        }

        return mapToSessionDto(session);
    }

    @Transactional
    public SessionDto createSession(UUID learnerId, CreateSessionRequest request) {
        User learner = userRepository.findById(learnerId)
                .orElseThrow(() -> new ApiException("DB-001", "Learner not found"));

        User tutor = userRepository.findById(request.getTutorId())
                .orElseThrow(() -> new ApiException("DB-001", "Tutor not found"));

        // Check for scheduling conflicts
        Instant endTime = request.getScheduledAt().plusSeconds(
                (request.getDurationMinutes() != null ? request.getDurationMinutes() : 60) * 60);
        List<Session> conflicts = sessionRepository.findConflictingSessions(
                tutor.getId(), request.getScheduledAt(), endTime);

        if (!conflicts.isEmpty()) {
            throw new ApiException("BUS-001", "Scheduling conflict: Tutor is not available at this time");
        }

        Session session = Session.builder()
                .learner(learner)
                .tutor(tutor)
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 60)
                .status(SessionStatus.PENDING)
                .topic(request.getTopic())
                .notes(request.getNotes())
                .location(request.getLocation())
                .build();

        if (request.getSpecializationId() != null) {
            session.setSpecialization(specializationRepository.findById(request.getSpecializationId())
                    .orElse(null));
        }

        sessionRepository.save(session);
        return mapToSessionDto(session);
    }

    @Transactional
    public SessionDto updateSessionStatus(UUID sessionId, UUID userId, UpdateSessionStatusRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("DB-001", "Session not found"));

        // Only tutor or admin can confirm/complete, both parties can cancel
        boolean isTutor = session.getTutor().getId().equals(userId);
        boolean isLearner = session.getLearner().getId().equals(userId);

        if (!isTutor && !isLearner) {
            throw new ApiException("AUTH-003", "Access denied");
        }

        SessionStatus newStatus = request.getStatus();
        
        // Validate state transitions
        if (newStatus == SessionStatus.CONFIRMED && !isTutor) {
            throw new ApiException("AUTH-003", "Only tutor can confirm sessions");
        }
        
        if (newStatus == SessionStatus.COMPLETED && !isTutor) {
            throw new ApiException("AUTH-003", "Only tutor can complete sessions");
        }

        if (newStatus == SessionStatus.CANCELLED) {
            session.setCancelledBy(userId);
            session.setCancellationReason(request.getCancellationReason());
        }

        session.setStatus(newStatus);
        sessionRepository.save(session);

        return mapToSessionDto(session);
    }

    @Transactional
    public void rateSession(UUID sessionId, UUID userId, RateSessionRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("DB-001", "Session not found"));

        if (!session.getLearner().getId().equals(userId)) {
            throw new ApiException("AUTH-003", "Only the learner can rate the session");
        }

        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new ApiException("BUS-001", "Can only rate completed sessions");
        }

        if (session.getRating() != null) {
            throw new ApiException("BUS-001", "Session already rated");
        }

        SessionRating rating = SessionRating.builder()
                .session(session)
                .ratedBy(session.getLearner())
                .rating(request.getRating())
                .feedback(request.getFeedback())
                .build();

        session.setRating(rating);
        sessionRepository.save(session);

        // Update tutor's average rating
        updateTutorRating(session.getTutor());
    }

    private void updateTutorRating(User tutor) {
        // Calculate average rating from all completed sessions
        // This would be done via a query in production
        tutor.setTotalSessions(tutor.getTotalSessions() != null ? tutor.getTotalSessions() + 1 : 1);
        userRepository.save(tutor);
    }

    private SessionDto mapToSessionDto(Session s) {
        return SessionDto.builder()
                .id(s.getId())
                .tutorId(s.getTutor().getId())
                .tutorName(s.getTutor().getFullName())
                .tutorAvatarUrl(s.getTutor().getAvatarUrl())
                .learnerId(s.getLearner().getId())
                .learnerName(s.getLearner().getFullName())
                .scheduledAt(s.getScheduledAt())
                .durationMinutes(s.getDurationMinutes())
                .status(s.getStatus())
                .topic(s.getTopic())
                .notes(s.getNotes())
                .location(s.getLocation())
                .specializationName(s.getSpecialization() != null ? s.getSpecialization().getName() : null)
                .rating(s.getRating() != null ? RatingDto.builder()
                        .rating(s.getRating().getRating())
                        .feedback(s.getRating().getFeedback())
                        .createdAt(s.getRating().getCreatedAt())
                        .build() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}

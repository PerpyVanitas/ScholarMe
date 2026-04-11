package com.scholarme.features.sessions;

import com.scholarme.features.sessions.dto.*;
import com.scholarme.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Sessions Feature Service
 * Contains all session business logic
 */
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionRatingRepository ratingRepository;
    private final SessionTutorRepository tutorRepository;
    private final com.scholarme.shared.repository.UserRepository userRepository;

    public List<SessionDto> getSessionsForUser(User user, String status) {
        String role = user.getRole().getName().toLowerCase();
        List<Session> sessions;
        
        if ("administrator".equals(role)) {
            sessions = status != null ? 
                sessionRepository.findByStatus(status) : 
                sessionRepository.findAll();
        } else if ("tutor".equals(role)) {
            sessions = status != null ?
                sessionRepository.findByTutorIdAndStatus(user.getId(), status) :
                sessionRepository.findByTutorId(user.getId());
        } else {
            sessions = status != null ?
                sessionRepository.findByLearnerIdAndStatus(user.getId(), status) :
                sessionRepository.findByLearnerId(user.getId());
        }
        
        return sessions.stream().map(this::toDto).collect(Collectors.toList());
    }

    public SessionDto createSession(UUID learnerId, CreateSessionRequest request) {
        Tutor tutor = tutorRepository.findById(request.getTutorId())
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found"));
        User learner = userRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        Session session = Session.builder()
                .tutor(tutor)
                .learner(learner)
                .scheduledDate(request.getScheduledDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .notes(request.getNotes())
                .status("pending")
                .build();

        return toDto(sessionRepository.save(session));
    }

    public SessionDto updateStatus(UUID sessionId, String status) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!List.of("pending", "confirmed", "completed", "cancelled").contains(status)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        session.setStatus(status);
        return toDto(sessionRepository.save(session));
    }

    @Transactional
    public SessionRatingDto rateSession(UUID sessionId, UUID learnerId, RateSessionRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getLearner().getId().equals(learnerId)) {
            throw new IllegalArgumentException("Only the learner can rate this session");
        }

        if (!"completed".equals(session.getStatus())) {
            throw new IllegalArgumentException("Can only rate completed sessions");
        }

        if (ratingRepository.findBySessionId(sessionId).isPresent()) {
            throw new IllegalArgumentException("Session already rated");
        }

        User learner = userRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        SessionRating rating = SessionRating.builder()
                .session(session)
                .learner(learner)
                .rating(request.getRating())
                .feedback(request.getFeedback())
                .build();

        SessionRating saved = ratingRepository.save(rating);
        updateTutorRating(session.getTutor(), request.getRating());

        return toRatingDto(saved);
    }

    private void updateTutorRating(Tutor tutor, int newRating) {
        BigDecimal currentTotal = tutor.getRating().multiply(BigDecimal.valueOf(tutor.getTotalRatings()));
        int newCount = tutor.getTotalRatings() + 1;
        BigDecimal newAvg = currentTotal.add(BigDecimal.valueOf(newRating))
                .divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);

        tutor.setRating(newAvg);
        tutor.setTotalRatings(newCount);
        tutorRepository.save(tutor);
    }

    private SessionDto toDto(Session session) {
        return SessionDto.builder()
                .id(session.getId().toString())
                .tutorId(session.getTutor().getId().toString())
                .tutorName(session.getTutor().getUser().getFullName())
                .learnerId(session.getLearner().getId().toString())
                .learnerName(session.getLearner().getFullName())
                .scheduledDate(session.getScheduledDate().toString())
                .startTime(session.getStartTime().toString())
                .endTime(session.getEndTime().toString())
                .status(session.getStatus())
                .notes(session.getNotes())
                .build();
    }

    private SessionRatingDto toRatingDto(SessionRating rating) {
        return SessionRatingDto.builder()
                .id(rating.getId().toString())
                .sessionId(rating.getSession().getId().toString())
                .rating(rating.getRating())
                .feedback(rating.getFeedback())
                .createdAt(rating.getCreatedAt().toString())
                .build();
    }
}

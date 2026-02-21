package com.scholarme.service;

import com.scholarme.entity.*;
import com.scholarme.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionRatingRepository ratingRepository;
    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;
    private final SpecializationRepository specializationRepository;

    public Session createSession(UUID learnerId, UUID tutorId, Session session) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found"));
        User learner = userRepository.findById(learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));

        session.setTutor(tutor);
        session.setLearner(learner);
        session.setStatus("pending");

        return sessionRepository.save(session);
    }

    public List<Session> getSessionsByLearner(UUID learnerId) {
        return sessionRepository.findByLearnerId(learnerId);
    }

    public List<Session> getSessionsByTutor(UUID tutorId) {
        return sessionRepository.findByTutorId(tutorId);
    }

    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }

    public Session updateStatus(UUID sessionId, String status) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!List.of("pending", "confirmed", "completed", "cancelled").contains(status)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        session.setStatus(status);
        return sessionRepository.save(session);
    }

    @Transactional
    public SessionRating rateSession(UUID sessionId, UUID learnerId, int rating, String feedback) {
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

        SessionRating sessionRating = SessionRating.builder()
                .session(session)
                .learner(learner)
                .rating(rating)
                .feedback(feedback)
                .build();

        SessionRating saved = ratingRepository.save(sessionRating);

        // Update tutor average rating
        Tutor tutor = session.getTutor();
        BigDecimal currentTotal = tutor.getRating().multiply(BigDecimal.valueOf(tutor.getTotalRatings()));
        int newCount = tutor.getTotalRatings() + 1;
        BigDecimal newAvg = currentTotal.add(BigDecimal.valueOf(rating))
                .divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP);

        tutor.setRating(newAvg);
        tutor.setTotalRatings(newCount);
        tutorRepository.save(tutor);

        return saved;
    }
}

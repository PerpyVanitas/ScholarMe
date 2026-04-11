package com.scholarme.service;

import com.scholarme.dto.DashboardDtos.*;
import com.scholarme.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SessionRepository sessionRepository;

    public DashboardStatsDto getStats(UUID userId) {
        // Count sessions by status
        int totalSessions = sessionRepository.countByLearnerIdOrTutorId(userId, userId);
        int upcomingSessions = sessionRepository.countByLearnerIdAndStatus(userId, "PENDING") +
                sessionRepository.countByLearnerIdAndStatus(userId, "CONFIRMED");
        int completedSessions = sessionRepository.countByLearnerIdAndStatus(userId, "COMPLETED");

        return DashboardStatsDto.builder()
                .totalSessions(totalSessions)
                .upcomingSessions(upcomingSessions)
                .completedSessions(completedSessions)
                .totalStudySets(0) // Not implemented yet
                .averageQuizScore(0.0) // Not implemented yet
                .build();
    }
}

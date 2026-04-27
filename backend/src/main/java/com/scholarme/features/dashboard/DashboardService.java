package com.scholarme.features.dashboard;

import com.scholarme.features.dashboard.dto.DashboardStatsDto;
import com.scholarme.features.sessions.SessionRepository;
import com.scholarme.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Dashboard Feature Service
 * Calculates dashboard statistics based on user role
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SessionRepository sessionRepository;

    public DashboardStatsDto getStatsForUser(User user) {
        String role = user.getRole().getName().toLowerCase();
        
        int totalSessions = sessionRepository.countByLearnerIdOrTutorId(user.getId(), user.getId());
        int pendingSessions;
        int completedSessions;
        
        if ("tutor".equals(role)) {
            pendingSessions = sessionRepository.countByTutorIdAndStatus(user.getId(), "pending");
            completedSessions = sessionRepository.countByTutorIdAndStatus(user.getId(), "completed");
        } else {
            pendingSessions = sessionRepository.countByLearnerIdAndStatus(user.getId(), "pending");
            completedSessions = sessionRepository.countByLearnerIdAndStatus(user.getId(), "completed");
        }
        
        return DashboardStatsDto.builder()
                .totalSessions(totalSessions)
                .pendingSessions(pendingSessions)
                .completedSessions(completedSessions)
                .upcomingSessions(pendingSessions) // Alias for pending
                .build();
    }
}

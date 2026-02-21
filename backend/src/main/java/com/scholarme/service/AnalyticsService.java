package com.scholarme.service;

import com.scholarme.entity.AnalyticsLog;
import com.scholarme.entity.User;
import com.scholarme.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsLogRepository analyticsLogRepository;
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final SessionRepository sessionRepository;
    private final RepositoryRepository repositoryRepository;

    public void logAction(UUID userId, String action, String entityType, String entityId, Map<String, Object> metadata) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        AnalyticsLog log = AnalyticsLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .metadata(metadata)
                .build();

        analyticsLogRepository.save(log);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalTutors", tutorRepository.count());
        stats.put("totalSessions", sessionRepository.count());
        stats.put("totalRepositories", repositoryRepository.count());
        stats.put("activeSessions", sessionRepository.findAll().stream()
                .filter(s -> "confirmed".equals(s.getStatus()) || "pending".equals(s.getStatus()))
                .count());
        return stats;
    }

    public List<AnalyticsLog> getRecentLogs(int limit) {
        return analyticsLogRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .toList();
    }
}

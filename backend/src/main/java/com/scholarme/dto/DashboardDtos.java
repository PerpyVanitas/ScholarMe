package com.scholarme.dto;

import lombok.*;

public class DashboardDtos {

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardStatsDto {
        private int totalSessions = 0;
        private int upcomingSessions = 0;
        private int completedSessions = 0;
        private int totalStudySets = 0;
        private double averageQuizScore = 0.0;
    }
}

package com.scholarme.features.dashboard.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStatsDto {
    private int totalSessions;
    private int pendingSessions;
    private int completedSessions;
    private int upcomingSessions;
    private int totalHours;
    private double averageRating;
}

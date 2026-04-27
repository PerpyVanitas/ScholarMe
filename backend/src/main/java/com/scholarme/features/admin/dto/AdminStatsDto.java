package com.scholarme.features.admin.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminStatsDto {
    private int totalUsers;
    private int totalTutors;
    private int totalLearners;
    private int totalSessions;
    private int activeSessions;
}

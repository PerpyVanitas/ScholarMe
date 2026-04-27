package com.scholarme.features.sessions.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionDto {
    private String id;
    private String tutorId;
    private String tutorName;
    private String learnerId;
    private String learnerName;
    private String scheduledDate;
    private String startTime;
    private String endTime;
    private String status;
    private String notes;
}

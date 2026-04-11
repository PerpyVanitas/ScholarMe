package com.scholarme.features.sessions.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateSessionRequest {
    @NotNull(message = "Tutor ID is required")
    private UUID tutorId;
    
    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;
    
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    
    @NotNull(message = "End time is required")
    private LocalTime endTime;
    
    private String notes;
}

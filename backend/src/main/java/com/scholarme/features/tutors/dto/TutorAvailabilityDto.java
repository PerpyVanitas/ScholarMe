package com.scholarme.features.tutors.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TutorAvailabilityDto {
    private String id;
    private Integer dayOfWeek;
    private String startTime;
    private String endTime;
    private Boolean isAvailable;
}

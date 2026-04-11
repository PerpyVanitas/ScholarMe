package com.scholarme.features.tutors.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TutorDto {
    private String id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String bio;
    private Double rating;
    private Integer totalRatings;
    private Integer totalSessions;
    private Boolean isAvailable;
    private List<String> specializations;
}

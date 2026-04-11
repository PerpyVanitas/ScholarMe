package com.scholarme.features.sessions.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionRatingDto {
    private String id;
    private String sessionId;
    private Integer rating;
    private String feedback;
    private String createdAt;
}

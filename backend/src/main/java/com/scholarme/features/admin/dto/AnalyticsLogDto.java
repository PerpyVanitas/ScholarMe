package com.scholarme.features.admin.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AnalyticsLogDto {
    private String id;
    private String eventType;
    private String eventData;
    private String createdAt;
}

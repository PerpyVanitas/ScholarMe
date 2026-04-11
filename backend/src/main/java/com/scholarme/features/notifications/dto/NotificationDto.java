package com.scholarme.features.notifications.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationDto {
    private String id;
    private String type;
    private String title;
    private String message;
    private Boolean isRead;
    private String createdAt;
}

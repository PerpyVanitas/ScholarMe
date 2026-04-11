package com.scholarme.features.admin.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminUserDto {
    private String id;
    private String fullName;
    private String email;
    private String role;
    private String createdAt;
    private boolean isActive;
}

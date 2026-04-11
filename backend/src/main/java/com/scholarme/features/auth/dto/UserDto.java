package com.scholarme.features.auth.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDto {
    private String id;
    private String fullName;
    private String email;
    private String role;
    private String avatarUrl;
    private String phone;
    private String bio;
    private String degreeProgram;
    private Integer yearLevel;
    private Double rating;
    private Integer totalSessions;
    private boolean isProfileComplete;
}

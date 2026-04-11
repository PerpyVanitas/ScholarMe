package com.scholarme.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class UserDtos {

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserProfileDto {
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

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
        private String bio;
        private String degreeProgram;
        private Integer yearLevel;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        private String newPassword;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class DeviceTokenRequest {
        @NotBlank(message = "Device type is required")
        private String deviceType;

        @NotBlank(message = "Token is required")
        private String token;
    }
}

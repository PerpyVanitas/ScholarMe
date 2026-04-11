package com.scholarme.dto.auth;

import com.scholarme.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Authentication related DTOs.
 */
public class AuthDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CardLoginRequest {
        @NotBlank(message = "Card ID is required")
        private String cardId;

        @NotBlank(message = "PIN is required")
        @Pattern(regexp = "^\\d{4,6}$", message = "PIN must be 4-6 digits")
        private String pin;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailLoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Full name is required")
        private String fullName;

        private Role role;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterCardRequest {
        @NotBlank(message = "Card ID is required")
        private String cardId;

        @NotBlank(message = "PIN is required")
        @Pattern(regexp = "^\\d{4,6}$", message = "PIN must be 4-6 digits")
        private String pin;

        private UUID userId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private UserDto user;
        private String token;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private UUID id;
        private String email;
        private String fullName;
        private Role role;
        private String avatarUrl;
        private String phone;
        private String bio;
        private String degreeProgram;
        private Integer yearLevel;
        private Double rating;
        private Integer totalSessions;
        private Boolean isProfileComplete;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
        private String bio;
        private String degreeProgram;
        private Integer yearLevel;
    }
}

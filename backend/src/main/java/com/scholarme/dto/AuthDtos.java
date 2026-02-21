package com.scholarme.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AuthDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CardLoginRequest {
        @NotBlank(message = "Card ID is required")
        private String cardId;

        @NotBlank(message = "PIN is required")
        private String pin;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class EmailLoginRequest {
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginResponse {
        private UserDto user;
        private String token;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String name;
        private String email;
        private String role;
        private String avatarUrl;
    }
}

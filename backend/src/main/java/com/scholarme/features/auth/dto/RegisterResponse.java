package com.scholarme.features.auth.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RegisterResponse {
    private UserDto user;
    private String token;
}

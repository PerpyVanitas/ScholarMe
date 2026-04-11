package com.scholarme.features.auth.dto;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LoginResponse {
    private UserDto user;
    private String token;
}

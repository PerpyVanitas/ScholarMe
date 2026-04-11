package com.scholarme.features.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DeviceTokenRequest {
    @NotBlank(message = "Token is required")
    private String token;
    
    @NotBlank(message = "Device type is required")
    private String deviceType; // "android", "ios", "web"
}

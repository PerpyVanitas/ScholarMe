package com.scholarme.features.sessions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateStatusRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "pending|confirmed|completed|cancelled", message = "Invalid status")
    private String status;
}

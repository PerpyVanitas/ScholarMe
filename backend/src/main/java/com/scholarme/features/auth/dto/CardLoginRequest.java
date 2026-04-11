package com.scholarme.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CardLoginRequest {
    @NotBlank(message = "Card ID is required")
    private String cardId;

    @NotBlank(message = "PIN is required")
    private String pin;
}

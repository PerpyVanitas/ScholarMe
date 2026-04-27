package com.scholarme.features.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateRoleRequest {
    @NotBlank(message = "Role is required")
    private String role;
}

package com.scholarme.features.users.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String bio;
    private String degreeProgram;
    private Integer yearLevel;
}

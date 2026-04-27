package com.scholarme.features.sessions.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SessionListResponse {
    private List<SessionDto> sessions;
}

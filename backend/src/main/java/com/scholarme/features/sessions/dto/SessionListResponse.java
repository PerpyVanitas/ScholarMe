package com.scholarme.features.sessions.dto;

import java.util.List;

public class SessionListResponse {
    private List<SessionDto> sessions;

    public SessionListResponse() {
    }

    public SessionListResponse(List<SessionDto> sessions) {
        this.sessions = sessions;
    }

    public List<SessionDto> getSessions() {
        return sessions;
    }

    public void setSessions(List<SessionDto> sessions) {
        this.sessions = sessions;
    }
}

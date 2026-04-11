package com.scholarme.dto.session;

import com.scholarme.domain.enums.SessionStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Session related DTOs.
 */
public class SessionDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateSessionRequest {
        @NotNull(message = "Tutor ID is required")
        private UUID tutorId;

        @NotNull(message = "Scheduled time is required")
        @Future(message = "Session must be scheduled in the future")
        private Instant scheduledAt;

        private UUID specializationId;
        private String topic;
        private String notes;
        private String location;
        
        @Min(15)
        @Max(240)
        private Integer durationMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateSessionStatusRequest {
        @NotNull(message = "Status is required")
        private SessionStatus status;

        private String cancellationReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateSessionRequest {
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        private Integer rating;

        private String feedback;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionDto {
        private UUID id;
        private UUID tutorId;
        private String tutorName;
        private String tutorAvatarUrl;
        private UUID learnerId;
        private String learnerName;
        private Instant scheduledAt;
        private Integer durationMinutes;
        private SessionStatus status;
        private String topic;
        private String notes;
        private String location;
        private String specializationName;
        private RatingDto rating;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingDto {
        private Integer rating;
        private String feedback;
        private Instant createdAt;
    }
}

package com.scholarme.dto.tutor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Tutor related DTOs.
 */
public class TutorDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TutorDto {
        private UUID id;
        private UUID userId;
        private String fullName;
        private String email;
        private String avatarUrl;
        private String bio;
        private String degreeProgram;
        private Double rating;
        private Integer totalSessions;
        private Double hourlyRate;
        private Integer experienceYears;
        private Boolean isAvailable;
        private List<SpecializationDto> specializations;
        private List<AvailabilityDto> availability;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecializationDto {
        private UUID id;
        private String name;
        private String description;
        private String category;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityDto {
        private UUID id;
        private Integer dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private Boolean isAvailable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateAvailabilityRequest {
        private Integer dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private Boolean isAvailable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TutorListResponse {
        private List<TutorDto> tutors;
        private PaginationInfo pagination;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationInfo {
        private int page;
        private int limit;
        private long total;
        private int pages;
    }
}

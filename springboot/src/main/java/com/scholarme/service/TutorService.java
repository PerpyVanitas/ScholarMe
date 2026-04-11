package com.scholarme.service;

import com.scholarme.domain.entity.TutorAvailability;
import com.scholarme.domain.entity.TutorProfile;
import com.scholarme.domain.repository.TutorProfileRepository;
import com.scholarme.dto.tutor.TutorDtos.*;
import com.scholarme.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Tutor service - manages tutor profiles and availability.
 */
@Service
@RequiredArgsConstructor
public class TutorService {

    private final TutorProfileRepository tutorProfileRepository;

    @Transactional(readOnly = true)
    public TutorListResponse getTutors(Pageable pageable, String search, UUID specializationId) {
        Page<TutorProfile> tutorsPage;

        if (search != null && !search.isBlank()) {
            tutorsPage = tutorProfileRepository.searchTutors(search, pageable);
        } else if (specializationId != null) {
            tutorsPage = tutorProfileRepository.findBySpecialization(specializationId, pageable);
        } else {
            tutorsPage = tutorProfileRepository.findAvailableTutors(pageable);
        }

        List<TutorDto> tutors = tutorsPage.getContent().stream()
                .map(this::mapToTutorDto)
                .collect(Collectors.toList());

        return TutorListResponse.builder()
                .tutors(tutors)
                .pagination(PaginationInfo.builder()
                        .page(tutorsPage.getNumber() + 1)
                        .limit(tutorsPage.getSize())
                        .total(tutorsPage.getTotalElements())
                        .pages(tutorsPage.getTotalPages())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public TutorDto getTutorById(UUID tutorId) {
        TutorProfile tutor = tutorProfileRepository.findById(tutorId)
                .orElseThrow(() -> new ApiException("DB-001", "Tutor not found"));
        return mapToTutorDto(tutor);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityDto> getTutorAvailability(UUID tutorId) {
        TutorProfile tutor = tutorProfileRepository.findById(tutorId)
                .orElseThrow(() -> new ApiException("DB-001", "Tutor not found"));

        return tutor.getAvailabilities().stream()
                .map(this::mapToAvailabilityDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<AvailabilityDto> updateAvailability(UUID userId, List<UpdateAvailabilityRequest> requests) {
        TutorProfile tutor = tutorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException("DB-001", "Tutor profile not found"));

        // Clear existing and add new availability
        tutor.getAvailabilities().clear();

        for (UpdateAvailabilityRequest req : requests) {
            TutorAvailability availability = TutorAvailability.builder()
                    .tutor(tutor)
                    .dayOfWeek(req.getDayOfWeek())
                    .startTime(req.getStartTime())
                    .endTime(req.getEndTime())
                    .isAvailable(req.getIsAvailable())
                    .build();
            tutor.getAvailabilities().add(availability);
        }

        tutorProfileRepository.save(tutor);

        return tutor.getAvailabilities().stream()
                .map(this::mapToAvailabilityDto)
                .collect(Collectors.toList());
    }

    private TutorDto mapToTutorDto(TutorProfile tutor) {
        var user = tutor.getUser();
        return TutorDto.builder()
                .id(tutor.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .degreeProgram(user.getDegreeProgram())
                .rating(user.getRating())
                .totalSessions(user.getTotalSessions())
                .hourlyRate(tutor.getHourlyRate())
                .experienceYears(tutor.getExperienceYears())
                .isAvailable(tutor.getIsAvailable())
                .specializations(tutor.getSpecializations().stream()
                        .map(s -> SpecializationDto.builder()
                                .id(s.getId())
                                .name(s.getName())
                                .description(s.getDescription())
                                .category(s.getCategory())
                                .build())
                        .collect(Collectors.toList()))
                .availability(tutor.getAvailabilities().stream()
                        .map(this::mapToAvailabilityDto)
                        .collect(Collectors.toList()))
                .build();
    }

    private AvailabilityDto mapToAvailabilityDto(TutorAvailability a) {
        return AvailabilityDto.builder()
                .id(a.getId())
                .dayOfWeek(a.getDayOfWeek())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .isAvailable(a.getIsAvailable())
                .build();
    }
}

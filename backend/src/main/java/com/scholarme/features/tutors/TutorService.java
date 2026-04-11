package com.scholarme.features.tutors;

import com.scholarme.features.tutors.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Tutors Feature Service
 * Tutor browsing and availability logic
 */
@Service
@RequiredArgsConstructor
public class TutorService {

    private final TutorRepository tutorRepository;
    private final TutorAvailabilityRepository availabilityRepository;

    public List<TutorDto> getAllTutors(UUID specializationId, Boolean available) {
        List<Tutor> tutors;
        
        if (available != null && available) {
            tutors = tutorRepository.findByIsAvailableTrue();
        } else {
            tutors = tutorRepository.findAll();
        }
        
        return tutors.stream().map(this::toDto).collect(Collectors.toList());
    }

    public TutorDto getTutorById(UUID id) {
        Tutor tutor = tutorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found"));
        return toDto(tutor);
    }

    public List<TutorAvailabilityDto> getTutorAvailability(UUID tutorId) {
        return availabilityRepository.findByTutorId(tutorId)
                .stream()
                .map(a -> TutorAvailabilityDto.builder()
                        .id(a.getId().toString())
                        .dayOfWeek(a.getDayOfWeek())
                        .startTime(a.getStartTime().toString())
                        .endTime(a.getEndTime().toString())
                        .isAvailable(a.getIsAvailable())
                        .build())
                .collect(Collectors.toList());
    }

    private TutorDto toDto(Tutor tutor) {
        return TutorDto.builder()
                .id(tutor.getId().toString())
                .fullName(tutor.getUser().getFullName())
                .email(tutor.getUser().getEmail())
                .avatarUrl(tutor.getUser().getAvatarUrl())
                .bio(tutor.getUser().getBio())
                .rating(tutor.getRating().doubleValue())
                .totalRatings(tutor.getTotalRatings())
                .totalSessions(tutor.getTotalSessions())
                .isAvailable(tutor.getIsAvailable())
                .build();
    }
}

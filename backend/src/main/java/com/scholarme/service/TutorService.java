package com.scholarme.service;

import com.scholarme.entity.Tutor;
import com.scholarme.entity.TutorAvailability;
import com.scholarme.repository.TutorAvailabilityRepository;
import com.scholarme.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TutorService {

    private final TutorRepository tutorRepository;
    private final TutorAvailabilityRepository availabilityRepository;

    public Page<Tutor> findTutors(String search, String specialization, int page, int limit) {
        return tutorRepository.findWithFilters(search, specialization, PageRequest.of(page - 1, limit));
    }

    public Tutor findById(UUID id) {
        return tutorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tutor not found"));
    }

    public Tutor findByUserId(UUID userId) {
        return tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tutor profile not found"));
    }

    public List<TutorAvailability> getAvailability(UUID tutorId) {
        return availabilityRepository.findByTutorId(tutorId);
    }

    public TutorAvailability addAvailability(UUID tutorId, TutorAvailability slot) {
        Tutor tutor = findById(tutorId);
        slot.setTutor(tutor);
        return availabilityRepository.save(slot);
    }

    public void deleteAvailability(UUID slotId) {
        availabilityRepository.deleteById(slotId);
    }

    public Tutor updateBio(UUID tutorId, String bio) {
        Tutor tutor = findById(tutorId);
        tutor.setBio(bio);
        return tutorRepository.save(tutor);
    }
}

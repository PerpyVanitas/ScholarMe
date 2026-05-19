package com.scholarme.features.tutors;

import com.scholarme.features.tutors.dto.TutorDto;
import com.scholarme.shared.entity.Tutor;
import com.scholarme.shared.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TutorServiceTest {

    @Mock
    private TutorRepository tutorRepository;

    @Mock
    private TutorAvailabilityRepository availabilityRepository;

    @InjectMocks
    private TutorService tutorService;

    private UUID tutorId;
    private Tutor tutor;

    @BeforeEach
    void setUp() {
        tutorId = UUID.randomUUID();
        User user = new User();
        user.setFullName("Jane Smith");
        user.setEmail("jane.smith@example.com");
        
        tutor = new Tutor();
        tutor.setId(tutorId);
        tutor.setUser(user);
        tutor.setRating(BigDecimal.valueOf(4.8));
        tutor.setTotalRatings(15);
        tutor.setIsAvailable(true);
    }

    @Test
    void getTutorById_success() {
        when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));

        TutorDto result = tutorService.getTutorById(tutorId);

        assertNotNull(result);
        assertEquals("Jane Smith", result.getFullName());
        assertEquals("jane.smith@example.com", result.getEmail());
        assertTrue(result.getIsAvailable());
    }

    @Test
    void getAllTutors_all_success() {
        when(tutorRepository.findAll()).thenReturn(List.of(tutor));

        List<TutorDto> result = tutorService.getAllTutors(null, null);

        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        assertEquals("Jane Smith", result.get(0).getFullName());
    }
}

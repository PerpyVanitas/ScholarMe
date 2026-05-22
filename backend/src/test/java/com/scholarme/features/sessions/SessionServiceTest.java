package com.scholarme.features.sessions;

import com.scholarme.features.sessions.dto.CreateSessionRequest;
import com.scholarme.features.sessions.dto.SessionDto;
import com.scholarme.shared.entity.Role;
import com.scholarme.shared.entity.Tutor;
import com.scholarme.shared.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private SessionRatingRepository ratingRepository;

    @Mock
    private SessionTutorRepository tutorRepository;

    @Mock
    private com.scholarme.shared.repository.UserRepository userRepository;

    @InjectMocks
    private SessionService sessionService;

    private User learner;
    private User tutorUser;
    private Tutor tutor;
    private Session session;

    @BeforeEach
    void setUp() {
        Role learnerRole = new Role();
        learnerRole.setName("LEARNER");

        learner = new User();
        learner.setId(UUID.randomUUID());
        learner.setFullName("Test Learner");
        learner.setRole(learnerRole);

        Role tutorRole = new Role();
        tutorRole.setName("TUTOR");

        tutorUser = new User();
        tutorUser.setId(UUID.randomUUID());
        tutorUser.setFullName("Test Tutor");
        tutorUser.setRole(tutorRole);

        tutor = new Tutor();
        tutor.setId(UUID.randomUUID());
        tutor.setUser(tutorUser);

        session = new Session();
        session.setId(UUID.randomUUID());
        session.setLearner(learner);
        session.setTutor(tutor);
        session.setScheduledDate(LocalDate.now());
        session.setStartTime(LocalTime.of(10, 0));
        session.setEndTime(LocalTime.of(11, 0));
        session.setStatus("pending");
    }

    @Test
    void createSession_ValidRequest_ReturnsDto() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setTutorId(tutor.getId());
        request.setScheduledDate(LocalDate.now());
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(11, 0));

        when(tutorRepository.findById(request.getTutorId())).thenReturn(Optional.of(tutor));
        when(userRepository.findById(learner.getId())).thenReturn(Optional.of(learner));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        SessionDto response = sessionService.createSession(learner.getId(), request);

        assertNotNull(response);
        assertEquals(session.getId().toString(), response.getId());
        assertEquals("pending", response.getStatus());
        assertEquals("Test Learner", response.getLearnerName());
    }

    @Test
    void updateStatus_ValidStatus_UpdatesSuccessfully() {
        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenReturn(session);

        SessionDto response = sessionService.updateStatus(session.getId(), "confirmed");

        assertNotNull(response);
        assertEquals("confirmed", response.getStatus());
        verify(sessionRepository).save(session);
    }

    @Test
    void updateStatus_InvalidStatus_ThrowsException() {
        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThrows(IllegalArgumentException.class, () -> sessionService.updateStatus(session.getId(), "invalid_status"));
        verify(sessionRepository, never()).save(any(Session.class));
    }
}

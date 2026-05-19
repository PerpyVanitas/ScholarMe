package com.scholarme.features.users;

import com.scholarme.features.users.dto.UpdateProfileRequest;
import com.scholarme.features.users.dto.UserProfileDto;
import com.scholarme.shared.entity.Role;
import com.scholarme.shared.entity.User;
import com.scholarme.shared.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        Role role = new Role();
        role.setName("LEARNER");

        user = new User();
        user.setId(userId);
        user.setFullName("John Doe");
        user.setEmail("john.doe@example.com");
        user.setRole(role);
        user.setAvatarUrl("avatar-url");
    }

    @Test
    void getProfile_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserProfileDto result = userService.getProfile(userId);

        assertNotNull(result);
        assertEquals("John Doe", result.getFullName());
        assertEquals("john.doe@example.com", result.getEmail());
        verify(userRepository, times(1)).findById(userId);
    }

    @Test
    void getProfile_notFound_throwsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> userService.getProfile(userId));
    }

    @Test
    void updateProfile_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Jane Doe");
        request.setPhone("123456");
        request.setBio("Hello bio");

        UserProfileDto result = userService.updateProfile(userId, request);

        assertNotNull(result);
        assertEquals("Jane Doe", user.getFullName());
        assertEquals("123456", user.getPhone());
        assertEquals("Hello bio", user.getBio());
    }
}

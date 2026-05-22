package com.scholarme.features.auth;

import com.scholarme.features.auth.dto.EmailLoginRequest;
import com.scholarme.features.auth.dto.LoginResponse;
import com.scholarme.features.auth.dto.RegisterRequest;
import com.scholarme.features.auth.dto.RegisterResponse;
import com.scholarme.shared.entity.Role;
import com.scholarme.shared.entity.User;
import com.scholarme.shared.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AuthCardRepository authCardRepository;

    @Mock
    private AuthUserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User mockUser;
    private Role mockRole;

    @BeforeEach
    void setUp() {
        mockRole = new Role();
        mockRole.setName("LEARNER");

        mockUser = new User();
        mockUser.setId(UUID.randomUUID());
        mockUser.setEmail("test@example.com");
        mockUser.setFullName("Test User");
        mockUser.setRole(mockRole);
    }

    @Test
    void emailLogin_ValidCredentials_ReturnsLoginResponse() {
        EmailLoginRequest request = new EmailLoginRequest("test@example.com", "password");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));
        when(jwtService.generateToken(mockUser.getId(), "LEARNER")).thenReturn("mock.jwt.token");

        LoginResponse response = authService.emailLogin(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("test@example.com", response.getUser().getEmail());
    }

    @Test
    void emailLogin_InvalidCredentials_ThrowsException() {
        EmailLoginRequest request = new EmailLoginRequest("notfound@example.com", "password");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> authService.emailLogin(request));
    }

    @Test
    void register_NewEmail_ReturnsRegisterResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setFullName("New User");
        request.setPassword("password");
        
        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail("new@example.com");
        savedUser.setFullName("New User");
        savedUser.setRole(mockRole);

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser.getId(), "LEARNER")).thenReturn("mock.jwt.token");

        RegisterResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("new@example.com", response.getUser().getEmail());
    }

    @Test
    void register_ExistingEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setFullName("Test User");
        request.setPassword("password");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
    }
}

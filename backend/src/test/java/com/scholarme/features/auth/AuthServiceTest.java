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
    void emailLogin_WrongPassword_ThrowsException() {
        EmailLoginRequest request = new EmailLoginRequest("test@example.com", "wrongpassword");
        mockUser.setPasswordHash("encodedpassword");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongpassword", "encodedpassword")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.emailLogin(request));
    }

    @Test
    void emailLogin_ValidCredentials_MatchesPassword_ReturnsLoginResponse() {
        EmailLoginRequest request = new EmailLoginRequest("test@example.com", "password");
        mockUser.setPasswordHash("encodedpassword");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password", "encodedpassword")).thenReturn(true);
        when(jwtService.generateToken(mockUser.getId(), "LEARNER")).thenReturn("mock.jwt.token");

        LoginResponse response = authService.emailLogin(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
    }

    @Test
    void cardLogin_Success() {
        com.scholarme.features.auth.dto.CardLoginRequest request = new com.scholarme.features.auth.dto.CardLoginRequest("CARD123", "1234");
        com.scholarme.shared.entity.AuthCard card = new com.scholarme.shared.entity.AuthCard();
        card.setCardId("CARD123");
        card.setPin("encodedpin");
        card.setUser(mockUser);

        when(authCardRepository.findByCardIdAndStatus("CARD123", "active")).thenReturn(Optional.of(card));
        when(passwordEncoder.matches("1234", "encodedpin")).thenReturn(true);
        when(jwtService.generateToken(mockUser.getId(), "LEARNER")).thenReturn("mock.jwt.token");

        LoginResponse response = authService.cardLogin(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
    }

    @Test
    void cardLogin_CardNotFound_ThrowsException() {
        com.scholarme.features.auth.dto.CardLoginRequest request = new com.scholarme.features.auth.dto.CardLoginRequest("CARD123", "1234");

        when(authCardRepository.findByCardIdAndStatus("CARD123", "active")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> authService.cardLogin(request));
    }

    @Test
    void cardLogin_InvalidPin_ThrowsException() {
        com.scholarme.features.auth.dto.CardLoginRequest request = new com.scholarme.features.auth.dto.CardLoginRequest("CARD123", "wrongpin");
        com.scholarme.shared.entity.AuthCard card = new com.scholarme.shared.entity.AuthCard();
        card.setPin("encodedpin");

        when(authCardRepository.findByCardIdAndStatus("CARD123", "active")).thenReturn(Optional.of(card));
        when(passwordEncoder.matches("wrongpin", "encodedpin")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.cardLogin(request));
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

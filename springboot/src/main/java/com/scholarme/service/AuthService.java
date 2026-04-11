package com.scholarme.service;

import com.scholarme.domain.entity.AuthCard;
import com.scholarme.domain.entity.User;
import com.scholarme.domain.enums.CardStatus;
import com.scholarme.domain.enums.Role;
import com.scholarme.domain.repository.AuthCardRepository;
import com.scholarme.domain.repository.UserRepository;
import com.scholarme.dto.auth.AuthDtos.*;
import com.scholarme.exception.ApiException;
import com.scholarme.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Authentication service - handles card-based and email authentication.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthCardRepository authCardRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional(readOnly = true)
    public LoginResponse cardLogin(CardLoginRequest request) {
        AuthCard card = authCardRepository.findByCardIdAndStatusWithUser(
                request.getCardId(), CardStatus.ACTIVE)
                .orElseThrow(() -> new ApiException("AUTH-001", "Invalid card credentials"));

        if (!passwordEncoder.matches(request.getPin(), card.getPinHash())) {
            throw new ApiException("AUTH-001", "Invalid card credentials");
        }

        User user = card.getUser();
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return LoginResponse.builder()
                .user(mapToUserDto(user))
                .token(token)
                .build();
    }

    @Transactional(readOnly = true)
    public LoginResponse emailLogin(EmailLoginRequest request) {
        // Note: For Supabase integration, password verification happens via Supabase Auth
        // This is a simplified version for standalone Spring Boot
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("AUTH-001", "Invalid credentials"));

        // In production, verify password against Supabase or stored hash
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return LoginResponse.builder()
                .user(mapToUserDto(user))
                .token(token)
                .build();
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("VALID-001", "Email already exists");
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .role(request.getRole() != null ? request.getRole() : Role.LEARNER)
                .isProfileComplete(false)
                .totalSessions(0)
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return LoginResponse.builder()
                .user(mapToUserDto(user))
                .token(token)
                .build();
    }

    @Transactional
    public void registerCard(RegisterCardRequest request) {
        if (authCardRepository.existsByCardId(request.getCardId())) {
            throw new ApiException("VALID-001", "Card ID already exists");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        AuthCard card = AuthCard.builder()
                .cardId(request.getCardId())
                .pinHash(passwordEncoder.encode(request.getPin()))
                .status(CardStatus.ACTIVE)
                .user(user)
                .build();

        authCardRepository.save(card);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .bio(user.getBio())
                .degreeProgram(user.getDegreeProgram())
                .yearLevel(user.getYearLevel())
                .rating(user.getRating())
                .totalSessions(user.getTotalSessions())
                .isProfileComplete(user.getIsProfileComplete())
                .build();
    }
}

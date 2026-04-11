package com.scholarme.service;

import com.scholarme.domain.entity.AuthCard;
import com.scholarme.domain.entity.User;
import com.scholarme.domain.enums.CardStatus;
import com.scholarme.domain.enums.Role;
import com.scholarme.domain.enums.SessionStatus;
import com.scholarme.domain.repository.AuthCardRepository;
import com.scholarme.domain.repository.SessionRepository;
import com.scholarme.domain.repository.UserRepository;
import com.scholarme.dto.auth.AuthDtos.*;
import com.scholarme.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Admin service - user and system management.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AuthCardRepository authCardRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(Role role, String search, Pageable pageable) {
        Page<User> users;

        if (search != null && !search.isBlank() && role != null) {
            users = userRepository.searchByRoleAndKeyword(role, search, pageable);
        } else if (role != null) {
            users = userRepository.findByRole(role, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::mapToUserDto);
    }

    @Transactional
    public UserDto createUser(RegisterRequest request) {
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
        return mapToUserDto(user);
    }

    @Transactional
    public UserDto updateUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        user.setRole(newRole);
        userRepository.save(user);
        return mapToUserDto(user);
    }

    @Transactional
    public void issueCredentials(RegisterCardRequest request) {
        if (authCardRepository.existsByCardId(request.getCardId())) {
            throw new ApiException("VALID-001", "Card ID already exists");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        // Revoke any existing card for this user
        authCardRepository.findByUserId(user.getId())
                .ifPresent(existingCard -> {
                    existingCard.setStatus(CardStatus.REVOKED);
                    authCardRepository.save(existingCard);
                });

        AuthCard card = AuthCard.builder()
                .cardId(request.getCardId())
                .pinHash(passwordEncoder.encode(request.getPin()))
                .status(CardStatus.ACTIVE)
                .user(user)
                .build();

        authCardRepository.save(card);
    }

    @Transactional
    public void revokeCredentials(String cardId) {
        AuthCard card = authCardRepository.findByCardId(cardId)
                .orElseThrow(() -> new ApiException("DB-001", "Card not found"));

        card.setStatus(CardStatus.REVOKED);
        authCardRepository.save(card);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsOverview() {
        Map<String, Object> analytics = new HashMap<>();

        analytics.put("totalUsers", userRepository.count());
        analytics.put("totalLearners", userRepository.countByRole(Role.LEARNER));
        analytics.put("totalTutors", userRepository.countByRole(Role.TUTOR));
        analytics.put("totalAdmins", userRepository.countByRole(Role.ADMIN));
        analytics.put("totalSessions", sessionRepository.count());
        analytics.put("pendingSessions", sessionRepository.findByStatus(SessionStatus.PENDING, 
                Pageable.unpaged()).getTotalElements());
        analytics.put("completedSessions", sessionRepository.findByStatus(SessionStatus.COMPLETED, 
                Pageable.unpaged()).getTotalElements());

        return analytics;
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

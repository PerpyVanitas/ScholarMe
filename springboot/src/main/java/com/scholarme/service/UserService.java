package com.scholarme.service;

import com.scholarme.domain.entity.User;
import com.scholarme.domain.repository.UserRepository;
import com.scholarme.dto.auth.AuthDtos.*;
import com.scholarme.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User service - manages user profiles and settings.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));
        return mapToUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getDegreeProgram() != null) {
            user.setDegreeProgram(request.getDegreeProgram());
        }
        if (request.getYearLevel() != null) {
            user.setYearLevel(request.getYearLevel());
        }

        // Check if profile is complete
        user.setIsProfileComplete(
                user.getFullName() != null && !user.getFullName().isBlank() &&
                user.getPhone() != null && !user.getPhone().isBlank() &&
                user.getDegreeProgram() != null && !user.getDegreeProgram().isBlank()
        );

        userRepository.save(user);
        return mapToUserDto(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        // For Supabase integration, password change happens via Supabase Auth
        // This is a placeholder for standalone implementation
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        // In production, verify current password and update via Supabase
        // For now, just validate the request format
        if (request.getNewPassword().length() < 6) {
            throw new ApiException("VALID-001", "Password must be at least 6 characters");
        }
    }

    @Transactional
    public void registerDeviceToken(UUID userId, String deviceType, String token) {
        // Store device token for push notifications
        // This would be stored in a device_tokens table
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("DB-001", "User not found"));

        // In production, save to device_tokens table
        // For now, just validate
        if (token == null || token.isBlank()) {
            throw new ApiException("VALID-001", "Token is required");
        }
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

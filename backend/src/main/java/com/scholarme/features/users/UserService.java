package com.scholarme.features.users;

import com.scholarme.features.users.dto.*;
import com.scholarme.shared.entity.User;
import com.scholarme.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Users Feature Service
 * User profile business logic
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toDto(user);
    }

    public UserProfileDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

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

        return toDto(userRepository.save(user));
    }

    public void changePassword(UUID userId, ChangePasswordRequest request) {
        // Note: Password changes should go through Supabase Auth
        // This is a placeholder for backend-only auth systems
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        // In production: validate current password, hash new password, update user
    }

    public void registerDeviceToken(UUID userId, DeviceTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setDeviceToken(request.getToken());
        user.setDeviceType(request.getDeviceType());
        userRepository.save(user);
    }

    private UserProfileDto toDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName().toUpperCase())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .bio(user.getBio())
                .degreeProgram(user.getDegreeProgram())
                .yearLevel(user.getYearLevel())
                .isProfileComplete(user.getFullName() != null && !user.getFullName().isBlank())
                .build();
    }
}

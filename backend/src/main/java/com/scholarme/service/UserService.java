package com.scholarme.service;

import com.scholarme.dto.UserDtos.*;
import com.scholarme.entity.User;
import com.scholarme.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toProfileDto(user);
    }

    @Transactional
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

        user = userRepository.save(user);
        return toProfileDto(user);
    }

    public void changePassword(UUID userId, ChangePasswordRequest request) {
        // In a real implementation, this would verify the current password
        // and update the password hash. Since we're using Supabase Auth for web,
        // this would typically call the Supabase Admin API or throw an error.
        throw new IllegalArgumentException("Password changes must be done through Supabase Auth");
    }

    public void registerDeviceToken(UUID userId, DeviceTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setDeviceToken(request.getToken());
        user.setDeviceType(request.getDeviceType());
        userRepository.save(user);
    }

    private UserProfileDto toProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getName().toUpperCase() : "LEARNER")
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .bio(user.getBio())
                .degreeProgram(user.getDegreeProgram())
                .yearLevel(user.getYearLevel())
                .isProfileComplete(user.getFullName() != null && !user.getFullName().isBlank())
                .build();
    }
}

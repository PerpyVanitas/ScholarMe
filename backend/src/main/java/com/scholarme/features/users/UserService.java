package com.scholarme.features.users;

import com.scholarme.features.users.dto.*;
import com.scholarme.shared.entity.DeviceToken;
import com.scholarme.shared.entity.User;
import com.scholarme.shared.repository.DeviceTokenRepository;
import com.scholarme.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Users Feature Service
 * User profile business logic
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DeviceTokenRepository deviceTokenRepository;

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



    public void registerDeviceToken(UUID userId, DeviceTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        deviceTokenRepository.findByTokenAndUser(request.getToken(), user)
                .ifPresentOrElse(
                        existingToken -> {
                            existingToken.setLastUsedAt(Instant.now());
                            deviceTokenRepository.save(existingToken);
                        },
                        () -> {
                            DeviceToken newToken = DeviceToken.builder()
                                    .user(user)
                                    .token(request.getToken())
                                    .platform(request.getDeviceType() != null ? request.getDeviceType() : "android")
                                    .lastUsedAt(Instant.now())
                                    .build();
                            deviceTokenRepository.save(newToken);
                        }
                );
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

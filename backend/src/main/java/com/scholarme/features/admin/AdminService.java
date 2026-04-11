package com.scholarme.features.admin;

import com.scholarme.features.admin.dto.*;
import com.scholarme.shared.entity.Role;
import com.scholarme.shared.entity.User;
import com.scholarme.shared.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin Feature Service
 * Administrative business logic
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AdminRoleRepository roleRepository;
    private final AdminAnalyticsRepository analyticsRepository;

    public AdminStatsDto getAdminStats() {
        long totalUsers = userRepository.count();
        long totalTutors = userRepository.countByRoleName("tutor");
        long totalLearners = userRepository.countByRoleName("learner");
        
        return AdminStatsDto.builder()
                .totalUsers((int) totalUsers)
                .totalTutors((int) totalTutors)
                .totalLearners((int) totalLearners)
                .build();
    }

    public List<AdminUserDto> getAllUsers(String role, int page, int size) {
        List<User> users;
        if (role != null && !role.isBlank()) {
            users = userRepository.findByRoleName(role, PageRequest.of(page, size));
        } else {
            users = userRepository.findAll(PageRequest.of(page, size)).getContent();
        }
        return users.stream().map(this::toAdminUserDto).collect(Collectors.toList());
    }

    public AdminUserDto updateUserRole(UUID userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Role role = roleRepository.findByName(roleName.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + roleName));
        
        user.setRole(role);
        return toAdminUserDto(userRepository.save(user));
    }

    public void deactivateUser(UUID userId) {
        // In a real implementation, this would set an 'active' flag to false
        // For now, we'll just verify the user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<AnalyticsLogDto> getAnalytics(String type, int page, int size) {
        return analyticsRepository.findByEventType(type, PageRequest.of(page, size))
                .stream()
                .map(log -> AnalyticsLogDto.builder()
                        .id(log.getId().toString())
                        .eventType(log.getEventType())
                        .eventData(log.getEventData())
                        .createdAt(log.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
    }

    private AdminUserDto toAdminUserDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }
}

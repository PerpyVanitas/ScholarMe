package com.scholarme.features.auth;

import com.scholarme.features.auth.dto.*;
import com.scholarme.shared.entity.AuthCard;
import com.scholarme.shared.entity.User;
import com.scholarme.shared.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Auth Feature Service
 * Contains all authentication business logic.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthCardRepository authCardRepository;
    private final AuthUserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse cardLogin(CardLoginRequest request) {
        AuthCard card = authCardRepository.findByCardIdAndStatus(request.getCardId(), "active")
                .orElseThrow(() -> new IllegalArgumentException("Invalid card credentials"));

        if (!passwordEncoder.matches(request.getPin(), card.getPin())) {
            throw new IllegalArgumentException("Invalid card credentials");
        }

        User user = card.getUser();
        String role = user.getRole().getName();
        String token = jwtService.generateToken(user.getId(), role);

        return LoginResponse.builder()
                .user(toUserDto(user))
                .token(token)
                .build();
    }

    public LoginResponse emailLogin(EmailLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        String role = user.getRole().getName();
        String token = jwtService.generateToken(user.getId(), role);

        return LoginResponse.builder()
                .user(toUserDto(user))
                .token(token)
                .build();
    }
    
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user = userRepository.save(user);
        
        String role = user.getRole() != null ? user.getRole().getName() : "LEARNER";
        String token = jwtService.generateToken(user.getId(), role);
        
        return RegisterResponse.builder()
                .user(toUserDto(user))
                .token(token)
                .build();
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
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

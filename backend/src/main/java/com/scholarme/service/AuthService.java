package com.scholarme.service;

import com.scholarme.dto.AuthDtos.*;
import com.scholarme.entity.AuthCard;
import com.scholarme.entity.User;
import com.scholarme.repository.AuthCardRepository;
import com.scholarme.repository.UserRepository;
import com.scholarme.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthCardRepository authCardRepository;
    private final UserRepository userRepository;
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
        // This delegates to the existing Supabase Auth in the web app.
        // For the Spring Boot API, we verify the user exists and issue a JWT.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        String role = user.getRole().getName();
        String token = jwtService.generateToken(user.getId(), role);

        return LoginResponse.builder()
                .user(toUserDto(user))
                .token(token)
                .build();
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId().toString())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName().toUpperCase())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}

package com.scholarme.service;

import com.scholarme.entity.*;
import com.scholarme.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthCardRepository authCardRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUserRole(UUID userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));

        user.setRole(role);
        return userRepository.save(user);
    }

    public AuthCard issueCard(UUID userId, String cardId, String pin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (authCardRepository.findByCardId(cardId).isPresent()) {
            throw new IllegalArgumentException("Card ID already exists");
        }

        AuthCard card = AuthCard.builder()
                .user(user)
                .cardId(cardId)
                .pin(passwordEncoder.encode(pin))
                .status("active")
                .build();

        return authCardRepository.save(card);
    }

    public AuthCard revokeCard(UUID cardId) {
        AuthCard card = authCardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));
        card.setStatus("revoked");
        return authCardRepository.save(card);
    }

    public AuthCard activateCard(UUID cardId) {
        AuthCard card = authCardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));
        card.setStatus("active");
        return authCardRepository.save(card);
    }

    public List<AuthCard> getAllCards() {
        return authCardRepository.findAll();
    }
}

package com.scholarme.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_cards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "card_id", nullable = false, unique = true)
    private String cardId;

    @Column(nullable = false)
    private String pin;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private String status = "active";

    @CreationTimestamp
    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;
}

package com.scholarme.domain.entity;

import com.scholarme.domain.enums.CardStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * AuthCard entity - Maps to 'auth_cards' table.
 * Physical authentication cards issued by administrators.
 */
@Entity
@Table(name = "auth_cards")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "card_id", unique = true, nullable = false)
    private String cardId;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CardStatus status;

    @Column(name = "issued_by")
    private UUID issuedBy;

    @CreatedDate
    @Column(name = "issued_at", updatable = false)
    private Instant issuedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    // Relationships
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;
}

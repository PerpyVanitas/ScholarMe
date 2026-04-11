package com.scholarme.domain.entity;

import com.scholarme.domain.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Session entity - Maps to 'sessions' table.
 * Tutoring sessions between learners and tutors.
 */
@Entity
@Table(name = "sessions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SessionStatus status;

    @Column(name = "topic")
    private String topic;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "location")
    private String location;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", referencedColumnName = "id")
    private User tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", referencedColumnName = "id")
    private User learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialization_id", referencedColumnName = "id")
    private Specialization specialization;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SessionRating rating;
}

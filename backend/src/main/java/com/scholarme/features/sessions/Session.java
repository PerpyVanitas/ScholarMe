package com.scholarme.features.sessions;

import com.scholarme.shared.entity.Tutor;
import com.scholarme.shared.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = true)
    private Tutor tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private User learner;

    @Column(name = "specialization_id")
    private UUID specializationId;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "start_time", nullable = true)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = true)
    private LocalTime endTime;

    @Builder.Default
    @Column(nullable = false)
    private String status = "pending";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}

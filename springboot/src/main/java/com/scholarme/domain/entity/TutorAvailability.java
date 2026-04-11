package com.scholarme.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;

/**
 * TutorAvailability entity - Maps to 'tutor_availability' table.
 * Weekly time slots when tutors are available.
 */
@Entity
@Table(name = "tutor_availability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 0 = Sunday, 6 = Saturday

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "is_available")
    private Boolean isAvailable;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", referencedColumnName = "id")
    private TutorProfile tutor;
}

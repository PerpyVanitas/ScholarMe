package com.scholarme.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * TutorProfile entity - Maps to 'tutor_profiles' table.
 * Extended profile information for tutors.
 */
@Entity
@Table(name = "tutor_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "hourly_rate")
    private Double hourlyRate;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "is_available")
    private Boolean isAvailable;

    @Column(name = "max_students")
    private Integer maxStudents;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Relationships
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "tutor_specializations",
        joinColumns = @JoinColumn(name = "tutor_id"),
        inverseJoinColumns = @JoinColumn(name = "specialization_id")
    )
    private Set<Specialization> specializations = new HashSet<>();

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL)
    private Set<TutorAvailability> availabilities = new HashSet<>();
}

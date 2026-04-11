package com.scholarme.domain.entity;

import com.scholarme.domain.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * User entity - Maps to 'profiles' table in Supabase.
 * Represents all users in the system (Learners, Tutors, Admins).
 */
@Entity
@Table(name = "profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "phone")
    private String phone;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "degree_program")
    private String degreeProgram;

    @Column(name = "year_level")
    private Integer yearLevel;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "total_sessions")
    private Integer totalSessions;

    @Column(name = "is_profile_complete")
    private Boolean isProfileComplete;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Relationships
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AuthCard authCard;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TutorProfile tutorProfile;
}

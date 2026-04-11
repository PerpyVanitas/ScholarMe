package com.scholarme.shared.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * User entity mapped to 'profiles' table
 * Shared across all features
 */
@Entity
@Table(name = "profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column
    private String phone;
    
    @Column
    private String bio;
    
    @Column(name = "degree_program")
    private String degreeProgram;
    
    @Column(name = "year_level")
    private Integer yearLevel;
    
    @Column(name = "device_token")
    private String deviceToken;
    
    @Column(name = "device_type")
    private String deviceType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

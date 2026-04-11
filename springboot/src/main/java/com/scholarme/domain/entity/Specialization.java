package com.scholarme.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Specialization entity - Maps to 'specializations' table.
 * Subjects/areas that tutors can specialize in.
 */
@Entity
@Table(name = "specializations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", unique = true, nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category;

    // Many-to-many with TutorProfile
    @ManyToMany(mappedBy = "specializations")
    private Set<TutorProfile> tutors = new HashSet<>();
}

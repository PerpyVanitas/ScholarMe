package com.scholarme.features.sessions;

import com.scholarme.shared.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tutors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tutor {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(precision = 2, scale = 1)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Column(name = "total_sessions")
    private Integer totalSessions = 0;

    @Column(name = "is_available")
    private Boolean isAvailable = true;
}

package com.scholarme.repository;

import com.scholarme.entity.SessionRating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SessionRatingRepository extends JpaRepository<SessionRating, UUID> {
    Optional<SessionRating> findBySessionId(UUID sessionId);
}

package com.scholarme.features.sessions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRatingRepository extends JpaRepository<SessionRating, UUID> {
    Optional<SessionRating> findBySessionId(UUID sessionId);
}

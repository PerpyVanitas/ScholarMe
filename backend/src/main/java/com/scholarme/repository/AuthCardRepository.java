package com.scholarme.repository;

import com.scholarme.entity.AuthCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuthCardRepository extends JpaRepository<AuthCard, UUID> {
    Optional<AuthCard> findByCardIdAndStatus(String cardId, String status);
    Optional<AuthCard> findByCardId(String cardId);
    List<AuthCard> findByUserId(UUID userId);
}

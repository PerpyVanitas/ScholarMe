package com.scholarme.features.auth;

import com.scholarme.shared.entity.AuthCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthCardRepository extends JpaRepository<AuthCard, UUID> {
    Optional<AuthCard> findByCardIdAndStatus(String cardId, String status);
}

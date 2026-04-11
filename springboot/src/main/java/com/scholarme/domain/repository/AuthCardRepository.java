package com.scholarme.domain.repository;

import com.scholarme.domain.entity.AuthCard;
import com.scholarme.domain.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthCardRepository extends JpaRepository<AuthCard, UUID> {

    Optional<AuthCard> findByCardId(String cardId);

    Optional<AuthCard> findByCardIdAndStatus(String cardId, CardStatus status);

    boolean existsByCardId(String cardId);

    @Query("SELECT ac FROM AuthCard ac JOIN FETCH ac.user WHERE ac.cardId = :cardId AND ac.status = :status")
    Optional<AuthCard> findByCardIdAndStatusWithUser(@Param("cardId") String cardId, 
                                                      @Param("status") CardStatus status);

    Optional<AuthCard> findByUserId(UUID userId);
}

package com.scholarme.shared.repository;

import com.scholarme.shared.entity.DeviceToken;
import com.scholarme.shared.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {
    Optional<DeviceToken> findByTokenAndUser(String token, User user);
}

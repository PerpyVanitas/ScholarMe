package com.scholarme.features.auth;

import com.scholarme.shared.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
}

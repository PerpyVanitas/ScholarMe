package com.scholarme.features.admin;

import com.scholarme.shared.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminRoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(String name);
}

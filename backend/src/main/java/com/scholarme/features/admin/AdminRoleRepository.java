package com.scholarme.features.admin;

import com.scholarme.shared.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByName(String name);
}

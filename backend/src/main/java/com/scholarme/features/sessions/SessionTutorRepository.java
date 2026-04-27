package com.scholarme.features.sessions;

import com.scholarme.shared.entity.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SessionTutorRepository extends JpaRepository<Tutor, UUID> {
}

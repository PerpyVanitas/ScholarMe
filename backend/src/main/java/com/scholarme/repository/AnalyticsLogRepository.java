package com.scholarme.repository;

import com.scholarme.entity.AnalyticsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AnalyticsLogRepository extends JpaRepository<AnalyticsLog, UUID> {
    List<AnalyticsLog> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AnalyticsLog> findByActionOrderByCreatedAtDesc(String action);
}

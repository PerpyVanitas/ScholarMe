package com.scholarme.features.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AdminAnalyticsRepository extends JpaRepository<AnalyticsLog, UUID> {
    @Query("SELECT a FROM AnalyticsLog a WHERE (:eventType IS NULL OR a.eventType = :eventType) ORDER BY a.createdAt DESC")
    List<AnalyticsLog> findByEventType(String eventType, Pageable pageable);
}

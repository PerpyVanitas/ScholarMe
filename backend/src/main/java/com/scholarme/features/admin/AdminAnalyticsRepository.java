package com.scholarme.features.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AdminAnalyticsRepository extends JpaRepository<AnalyticsLog, UUID> {
    @Query("SELECT a FROM AnalyticsLog a WHERE (:action IS NULL OR a.action = :action) ORDER BY a.createdAt DESC")
    List<AnalyticsLog> findByAction(String action, Pageable pageable);
}

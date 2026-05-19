package com.scholarme.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dashboard_stats")
data class DashboardStatsEntity(
    @PrimaryKey val id: Int = 0,
    val role: String = "learner",
    
    // Admin
    val totalUsers: Int = 0,
    val totalSessions: Int = 0,
    val activeTutors: Int = 0,
    val pendingSessions: Int = 0,
    
    // Tutor
    val completedSessions: Int = 0,
    val upcomingSessions: Int = 0,
    val rating: Double = 0.0,
    val totalRatings: Int = 0,
    
    // Gamification
    val totalXp: Int = 0,
    val currentLevel: Int = 1
)

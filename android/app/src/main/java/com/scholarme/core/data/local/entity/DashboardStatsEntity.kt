package com.scholarme.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dashboard_stats")
data class DashboardStatsEntity(
    @PrimaryKey val id: Int = 1, // Single row for stats
    val totalSessions: Int,
    val upcomingSessions: Int,
    val completedSessions: Int,
    val totalStudySets: Int,
    val averageQuizScore: Double,
    val lastUpdated: Long = System.currentTimeMillis()
)

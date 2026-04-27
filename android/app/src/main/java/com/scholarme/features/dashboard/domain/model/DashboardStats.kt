package com.scholarme.features.dashboard.domain.model

data class DashboardStats(
    val totalSessions: Int = 0,
    val upcomingSessions: Int = 0,
    val completedSessions: Int = 0,
    val totalStudySets: Int = 0,
    val averageQuizScore: Double = 0.0
)

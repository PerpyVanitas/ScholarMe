package com.scholarme.features.dashboard.domain.model

data class DashboardStats(
    // Common
    val userId: String = "",
    val role: String = "learner",
    
    // Admin Stats
    val totalUsers: Int = 0,
    val totalSessions: Int = 0,
    val activeTutors: Int = 0,
    val pendingSessions: Int = 0,
    
    // Tutor Stats
    val completedSessions: Int = 0,
    val upcomingSessions: Int = 0,
    val rating: Double = 0.0,
    val totalRatings: Int = 0,
    
    // Learner Stats
    val totalBookedSessions: Int = 0,
    val learnerCompletedSessions: Int = 0,
    val learnerUpcomingSessions: Int = 0,
    
    // Gamification
    val totalXp: Int = 0,
    val currentLevel: Int = 1
)

data class Session(
    val id: String,
    val tutorId: String? = null,
    val tutorName: String? = null,
    val tutorAvatarUrl: String? = null,
    val learnerId: String? = null,
    val scheduledAt: String,
    val startTime: String,
    val endTime: String,
    val status: String,
    val topic: String? = null,
    val notes: String? = null,
    val specializationName: String? = null
)

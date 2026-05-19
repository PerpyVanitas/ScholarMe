package com.scholarme.features.dashboard.data.model

import com.google.gson.annotations.SerializedName

data class DashboardStats(
    @SerializedName("role") val role: String = "learner",
    
    // Admin
    @SerializedName("totalUsers") val totalUsers: Int = 0,
    @SerializedName("totalSessions") val totalSessions: Int = 0,
    @SerializedName("activeTutors") val activeTutors: Int = 0,
    @SerializedName("pendingSessions") val pendingSessions: Int = 0,
    
    // Tutor
    @SerializedName("completedSessions") val completedSessions: Int = 0,
    @SerializedName("upcomingSessions") val upcomingSessions: Int = 0,
    @SerializedName("rating") val rating: Double = 0.0,
    @SerializedName("totalRatings") val totalRatings: Int = 0,
    
    // Gamification
    @SerializedName("totalXp") val totalXp: Int = 0,
    @SerializedName("currentLevel") val currentLevel: Int = 1
)

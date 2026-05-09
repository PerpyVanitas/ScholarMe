package com.scholarme.features.dashboard.data.model

import com.google.gson.annotations.SerializedName

data class DashboardStats(
    @SerializedName("totalSessions") val totalSessions: Int = 0,
    @SerializedName("upcomingSessions") val upcomingSessions: Int = 0,
    @SerializedName("completedSessions") val completedSessions: Int = 0,
    @SerializedName("totalStudySets") val totalStudySets: Int = 0,
    @SerializedName("averageQuizScore") val averageQuizScore: Double = 0.0,
    @SerializedName("totalXp") val totalXp: Int = 0,
    @SerializedName("currentLevel") val currentLevel: Int = 1
)

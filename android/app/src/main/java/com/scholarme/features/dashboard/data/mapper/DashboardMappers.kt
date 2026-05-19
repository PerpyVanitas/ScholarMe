package com.scholarme.features.dashboard.data.mapper

import com.scholarme.core.data.local.entity.DashboardStatsEntity
import com.scholarme.core.data.local.entity.SessionEntity
import com.scholarme.features.dashboard.data.model.DashboardStats as DashboardStatsDto
import com.scholarme.features.sessions.data.model.SessionDto
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.features.dashboard.domain.model.Session

fun DashboardStatsDto.toEntity(): DashboardStatsEntity {
    return DashboardStatsEntity(
        role = this.role,
        totalUsers = this.totalUsers,
        totalSessions = this.totalSessions,
        activeTutors = this.activeTutors,
        pendingSessions = this.pendingSessions,
        completedSessions = this.completedSessions,
        upcomingSessions = this.upcomingSessions,
        rating = this.rating,
        totalRatings = this.totalRatings,
        totalXp = this.totalXp,
        currentLevel = this.currentLevel
    )
}

fun DashboardStatsEntity.toDomain(): DashboardStats {
    return DashboardStats(
        role = this.role,
        totalUsers = this.totalUsers,
        totalSessions = this.totalSessions,
        activeTutors = this.activeTutors,
        pendingSessions = this.pendingSessions,
        completedSessions = this.completedSessions,
        upcomingSessions = this.upcomingSessions,
        rating = this.rating,
        totalRatings = this.totalRatings,
        totalXp = this.totalXp,
        currentLevel = this.currentLevel
    )
}

fun SessionDto.toEntity(): SessionEntity {
    return SessionEntity(
        id = this.id,
        tutorId = this.tutorId,
        tutorName = this.tutorName,
        tutorAvatarUrl = this.tutorAvatarUrl,
        learnerId = this.learnerId,
        learnerName = this.learnerName,
        scheduledAt = "${this.scheduledDate} ${this.startTime}",
        durationMinutes = 60,
        status = this.status,
        topic = this.topic,
        notes = this.notes,
        location = this.location,
        specializationName = this.specializationName,
        rating = this.rating?.rating,
        feedback = this.rating?.feedback,
        createdAt = this.createdAt
    )
}

fun SessionEntity.toDomain(): Session {
    return Session(
        id = this.id,
        tutorId = this.tutorId,
        tutorName = this.tutorName,
        tutorAvatarUrl = this.tutorAvatarUrl,
        learnerId = this.learnerId,
        scheduledAt = this.scheduledAt,
        startTime = this.scheduledAt.split(" ").lastOrNull() ?: "",
        endTime = "", // Can be calculated if needed
        status = this.status,
        topic = this.topic,
        notes = this.notes,
        specializationName = this.specializationName
    )
}

package com.scholarme.features.dashboard.data.mapper

import com.scholarme.core.data.local.entity.DashboardStatsEntity
import com.scholarme.core.data.local.entity.SessionEntity
import com.scholarme.core.data.model.DashboardStats as DashboardStatsDto
import com.scholarme.core.data.model.SessionDto
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.features.dashboard.domain.model.Session

fun DashboardStatsDto.toEntity(): DashboardStatsEntity {
    return DashboardStatsEntity(
        totalSessions = this.totalSessions,
        upcomingSessions = this.upcomingSessions,
        completedSessions = this.completedSessions,
        totalStudySets = this.totalStudySets,
        averageQuizScore = this.averageQuizScore
    )
}

fun DashboardStatsEntity.toDomain(): DashboardStats {
    return DashboardStats(
        totalSessions = this.totalSessions,
        upcomingSessions = this.upcomingSessions,
        completedSessions = this.completedSessions,
        totalStudySets = this.totalStudySets,
        averageQuizScore = this.averageQuizScore
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
        scheduledAt = this.scheduledAt,
        durationMinutes = this.durationMinutes,
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
        learnerName = this.learnerName,
        scheduledAt = this.scheduledAt,
        durationMinutes = this.durationMinutes,
        status = this.status,
        topic = this.topic,
        notes = this.notes,
        location = this.location,
        specializationName = this.specializationName,
        rating = this.rating,
        feedback = this.feedback,
        createdAt = this.createdAt
    )
}

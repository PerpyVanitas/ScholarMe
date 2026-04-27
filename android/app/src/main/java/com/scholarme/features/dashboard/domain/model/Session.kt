package com.scholarme.features.dashboard.domain.model

data class Session(
    val id: String,
    val tutorId: String,
    val tutorName: String?,
    val tutorAvatarUrl: String?,
    val learnerId: String,
    val learnerName: String?,
    val scheduledAt: String,
    val durationMinutes: Int,
    val status: String,
    val topic: String?,
    val notes: String?,
    val location: String?,
    val specializationName: String?,
    val rating: Int?,
    val feedback: String?,
    val createdAt: String?
)

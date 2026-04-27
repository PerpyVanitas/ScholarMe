package com.scholarme.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sessions")
data class SessionEntity(
    @PrimaryKey val id: String,
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
    val createdAt: String?,
    val lastUpdated: Long = System.currentTimeMillis()
)

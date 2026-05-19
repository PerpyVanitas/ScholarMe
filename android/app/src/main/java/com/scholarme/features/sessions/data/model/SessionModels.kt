package com.scholarme.features.sessions.data.model

import com.google.gson.annotations.SerializedName

data class SessionDto(
    val id: String,
    @SerializedName("tutorId") val tutorId: String,
    @SerializedName("tutorName") val tutorName: String? = null,
    @SerializedName("tutorAvatarUrl") val tutorAvatarUrl: String? = null,
    @SerializedName("learnerId") val learnerId: String,
    @SerializedName("learnerName") val learnerName: String? = null,
    @SerializedName("scheduledDate") val scheduledDate: String,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    val status: String,
    val notes: String? = null,
    val location: String? = null,
    @SerializedName("specializationName") val specializationName: String? = null,
    val rating: RatingDto? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("topic") val topic: String? = null
)

data class SessionListResponse(
    val sessions: List<SessionDto>,
    val pagination: com.scholarme.core.data.model.PaginationInfo
)

typealias Session = SessionDto

data class RatingDto(
    val rating: Int,
    val feedback: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class CreateSessionRequest(
    @SerializedName("tutorId") val tutorId: String,
    @SerializedName("scheduledAt") val scheduledAt: String,
    @SerializedName("specializationId") val specializationId: String? = null,
    val topic: String? = null,
    val notes: String? = null,
    val location: String? = null,
    @SerializedName("durationMinutes") val durationMinutes: Int = 60
)

data class UpdateSessionStatusRequest(
    val status: String,
    @SerializedName("cancellationReason") val cancellationReason: String? = null
)

data class RateSessionRequest(
    val rating: Int,
    val feedback: String? = null
)

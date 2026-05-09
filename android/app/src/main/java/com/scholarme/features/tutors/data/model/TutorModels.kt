package com.scholarme.features.tutors.data.model

import com.google.gson.annotations.SerializedName

data class TutorDto(
    val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("fullName") val fullName: String,
    val email: String,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    val bio: String? = null,
    @SerializedName("degreeProgram") val degreeProgram: String? = null,
    val rating: Double? = null,
    @SerializedName("totalSessions") val totalSessions: Int? = null,
    @SerializedName("hourlyRate") val hourlyRate: Double? = null,
    @SerializedName("experienceYears") val experienceYears: Int? = null,
    @SerializedName("isAvailable") val isAvailable: Boolean = true,
    val specializations: List<SpecializationDto> = emptyList(),
    val availability: List<AvailabilityDto> = emptyList()
)

data class SpecializationDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val category: String? = null
)

data class AvailabilityDto(
    val id: String,
    @SerializedName("dayOfWeek") val dayOfWeek: Int,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("isAvailable") val isAvailable: Boolean = true
)

data class TutorListResponse(
    val tutors: List<TutorDto>,
    val pagination: com.scholarme.core.data.model.PaginationInfo
)

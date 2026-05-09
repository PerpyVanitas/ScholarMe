package com.scholarme.features.profile.data.model

import com.google.gson.annotations.SerializedName

data class UserProfile(
    val id: String? = null,
    val email: String? = null,
    @SerializedName("fullName") val fullName: String? = null,
    val role: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    val phone: String? = null,
    val bio: String? = null,
    @SerializedName("degreeProgram") val degreeProgram: String? = null,
    @SerializedName("yearLevel") val yearLevel: Int? = null,
    val rating: Double? = null,
    @SerializedName("totalSessions") val totalSessions: Int? = null,
    @SerializedName("isProfileComplete") val isProfileComplete: Boolean = false,
    
    // Gamification fields
    @SerializedName("totalXp") val totalXp: Int? = 0,
    @SerializedName("currentLevel") val currentLevel: Int? = 1
)

// Alias for convenience
typealias ProfileDto = UserProfile

data class UpdateProfileRequest(
    @SerializedName("fullName") val fullName: String? = null,
    val phone: String? = null,
    val bio: String? = null,
    @SerializedName("degreeProgram") val degreeProgram: String? = null,
    @SerializedName("yearLevel") val yearLevel: Int? = null
)

data class ChangePasswordRequest(
    @SerializedName("currentPassword") val currentPassword: String,
    @SerializedName("newPassword") val newPassword: String
)

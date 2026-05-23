package com.scholarme.features.profile.data.model

import com.google.gson.annotations.SerializedName

data class UserProfile(
    @SerializedName("userId") val id: String? = null,
    val email: String? = null,
    @SerializedName("fullName") val fullName: String? = null,
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null,
    @SerializedName("accountType") val role: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("phoneNumber") val phone: String? = null,
    val birthdate: String? = null,
    val bio: String? = null,
    @SerializedName("program") val degreeProgram: String? = null,
    @SerializedName("studentId") val studentId: String? = null,
    @SerializedName("emergencyContact") val emergencyContact: String? = null,
    @SerializedName("yearLevel") val yearLevel: Int? = null,
    @SerializedName("hourlyRate") val hourlyRate: Double? = null,
    @SerializedName("yearsExperience") val yearsExperience: Int? = null,
    val rating: Double? = null,
    @SerializedName("totalSessions") val totalSessions: Int? = null,
    @SerializedName("profileCompleted") val isProfileComplete: Boolean = false,
    
    // Gamification fields
    @SerializedName("totalXp") val totalXp: Int? = 0,
    @SerializedName("currentLevel") val currentLevel: Int? = 1,
    
    @SerializedName("hs_designations") val hsDesignations: List<String>? = null,
    
    // Card Management fields
    @SerializedName("isCardIssued") val isCardIssued: Boolean = false,
    @SerializedName("uniqueIdNumber") val uniqueIdNumber: String? = null
)

// Alias for convenience
typealias ProfileDto = UserProfile

data class UpdateProfileRequest(
    @SerializedName("fullName") val fullName: String? = null,
    @SerializedName("phoneNumber") val phone: String? = null,
    val bio: String? = null,
    @SerializedName("degreeProgram") val degreeProgram: String? = null,
    @SerializedName("yearLevel") val yearLevel: Int? = null,
    @SerializedName("hourlyRate") val hourlyRate: Double? = null,
    @SerializedName("yearsExperience") val yearsExperience: Int? = null
)

data class ChangePasswordRequest(
    @SerializedName("currentPassword") val currentPassword: String,
    @SerializedName("newPassword") val newPassword: String
)

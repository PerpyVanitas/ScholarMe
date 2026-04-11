package com.scholarme.core.data.model

import com.google.gson.annotations.SerializedName

// ============================================
// API Response Wrapper
// ============================================

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T? = null
)

// ============================================
// Auth Models
// ============================================

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserProfile
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("full_name") val fullName: String,
    val role: String = "learner"
)

data class RegisterResponse(
    @SerializedName("user_id") val userId: String
)

// ============================================
// User/Profile Models
// ============================================

data class UserProfile(
    val id: String,
    val email: String,
    @SerializedName("full_name") val fullName: String,
    @SerializedName("first_name") val firstName: String? = null,
    @SerializedName("last_name") val lastName: String? = null,
    @SerializedName("avatar_url") val avatarUrl: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    val role: String,
    @SerializedName("profile_completed") val profileCompleted: Boolean = false,
    @SerializedName("created_at") val createdAt: String? = null,
    // Tutor-specific fields
    val bio: String? = null,
    val rating: Double? = null,
    @SerializedName("total_ratings") val totalRatings: Int? = null,
    @SerializedName("years_experience") val yearsExperience: Int? = null,
    @SerializedName("hourly_rate") val hourlyRate: Double? = null
)

data class UpdateProfileRequest(
    @SerializedName("full_name") val fullName: String? = null,
    @SerializedName("first_name") val firstName: String? = null,
    @SerializedName("last_name") val lastName: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    val bio: String? = null
)

data class ChangePasswordRequest(
    @SerializedName("current_password") val currentPassword: String,
    @SerializedName("new_password") val newPassword: String
)

// ============================================
// Dashboard Models
// ============================================

data class DashboardStats(
    @SerializedName("total_sessions") val totalSessions: Int = 0,
    @SerializedName("upcoming_sessions") val upcomingSessions: Int = 0,
    @SerializedName("completed_sessions") val completedSessions: Int = 0,
    @SerializedName("total_study_sets") val totalStudySets: Int = 0,
    @SerializedName("average_quiz_score") val averageQuizScore: Double = 0.0
)

data class Session(
    val id: String,
    @SerializedName("tutor_id") val tutorId: String,
    @SerializedName("learner_id") val learnerId: String,
    @SerializedName("scheduled_date") val scheduledDate: String,
    @SerializedName("start_time") val startTime: String,
    @SerializedName("end_time") val endTime: String,
    val status: String,
    val notes: String? = null,
    @SerializedName("tutor_name") val tutorName: String? = null,
    @SerializedName("learner_name") val learnerName: String? = null
)

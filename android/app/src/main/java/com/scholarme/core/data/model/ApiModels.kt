package com.scholarme.core.data.model

import com.google.gson.annotations.SerializedName
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

// ============================================
// API Response Wrapper (matches Spring Boot ApiResponse)
// ============================================

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ErrorDetails? = null,
    val timestamp: String? = null
)

data class ErrorDetails(
    val code: String,
    val message: String,
    val details: Any? = null
)

// ============================================
// Auth Models (matches Spring Boot AuthDtos)
// ============================================

data class CardLoginRequest(
    @SerializedName("cardId") val cardId: String,
    val pin: String
)

data class EmailLoginRequest(
    val email: String,
    val password: String
)

// Legacy support - maps to EmailLoginRequest
typealias LoginRequest = EmailLoginRequest

data class LoginResponse(
    @SerializedName("user") val user: UserProfile?,
    @SerializedName("session") val token: String,
    @SerializedName("profile") val profile: UserProfile? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("email") val email: String? = null
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("fullName") val fullName: String,
    val role: String = "LEARNER"
)

data class RegisterResponse(
    @SerializedName("user") val user: UserProfile?,
    @SerializedName("token") val token: String?,
    @SerializedName("session") val sessionToken: String? = null
)

// ============================================
// User/Profile Models (matches Spring Boot UserDto)
// ============================================

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

// ============================================
// Tutor Models (matches Spring Boot TutorDtos)
// ============================================

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
    val pagination: PaginationInfo
)

data class PaginationInfo(
    val page: Int,
    val limit: Int,
    val total: Long,
    val pages: Int
)

// ============================================
// Session Models (matches Spring Boot SessionDtos)
// ============================================

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
    @SerializedName("createdAt") val createdAt: String? = null
)

data class SessionListResponse(
    val sessions: List<SessionDto>,
    val pagination: PaginationInfo
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

// ============================================
// Repository Models
// ============================================

data class RepositoryDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val visibility: String = "private",
    @SerializedName("ownerId") val ownerId: String,
    @SerializedName("ownerName") val ownerName: String? = null,
    @SerializedName("resourceCount") val resourceCount: Long = 0,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class ResourceDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val url: String? = null,
    @SerializedName("fileType") val fileType: String? = null,
    @SerializedName("fileSize") val fileSize: Long? = null,
    @SerializedName("uploadedById") val uploadedById: String? = null,
    @SerializedName("uploadedByName") val uploadedByName: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class RepositoryListResponse(
    val repositories: List<RepositoryDto>
)

data class ResourceListResponse(
    val resources: List<ResourceDto>
)

// ============================================
// Dashboard Models
// ============================================

data class DashboardStats(
    @SerializedName("role") val role: String? = null,
    @SerializedName("totalSessions") val totalSessions: Int = 0,
    @SerializedName("upcomingSessions") val upcomingSessions: Int = 0,
    @SerializedName("completedSessions") val completedSessions: Int = 0,
    @SerializedName("totalUsers") val totalUsers: Int? = null,
    @SerializedName("activeTutors") val activeTutors: Int? = null,
    @SerializedName("pendingSessions") val pendingSessions: Int? = null,
    @SerializedName("rating") val rating: Double? = null,
    @SerializedName("totalRatings") val totalRatings: Int? = null,
    @SerializedName("totalStudySets") val totalStudySets: Int = 0,
    @SerializedName("averageQuizScore") val averageQuizScore: Double = 0.0
)

// ============================================
// Admin & Specialized Models
// ============================================

data class AdminAnalytics(
    val totalRevenue: Double,
    val userGrowth: List<DataPoint>,
    val sessionSuccessRate: Double,
    val topSpecializations: List<StringCount>
)

data class DataPoint(val label: String, val value: Double)
data class StringCount(val name: String, val count: Int)

data class AuditLogEntry(
    val id: String,
    val userId: String,
    val action: String,
    val entityType: String,
    val entityId: String,
    val details: String?,
    val timestamp: String
)

data class AdminTimesheet(
    val id: String,
    val tutorId: String,
    val tutorName: String,
    val totalHours: Double,
    val amount: Double,
    val status: String,
    val periodStart: String,
    val periodEnd: String
)

data class StudySetItem(
    val id: String,
    val term: String,
    val definition: String
)

data class StudySetResponse(
    val id: String,
    val title: String,
    val description: String?,
    val items: List<StudySetItem>
)

data class QuizDto(
    val id: String,
    val title: String,
    val description: String?,
    val questionCount: Int
)

data class QuizQuestionDto(
    val id: String,
    val questionText: String,
    val options: List<String>,
    val correctAnswerIndex: Int
)

@Parcelize
data class AuthCard(
    val id: String,
    val userId: String?,
    val userName: String?,
    val pin: String,
    val status: String,
    val issuedAt: String
) : Parcelable

@Parcelize
data class LeaderboardEntry(
    val rank: Int,
    val id: String,
    val fullName: String,
    val avatarUrl: String?,
    @SerializedName("totalXp") val totalXp: Int,
    @SerializedName("currentLevel") val currentLevel: Int,
    val profileThemeColor: String?,
    val isCurrentUser: Boolean
) : Parcelable

@Parcelize
data class LeaderboardResponse(
    val leaderboard: List<LeaderboardEntry>,
    val currentUserId: String
) : Parcelable

data class NotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val type: String,
    val time: String,
    val read: Boolean
)

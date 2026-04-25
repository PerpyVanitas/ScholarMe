package com.scholarme.core.data.model

import com.google.gson.annotations.SerializedName

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

data class ApiError(
    val success: Boolean = false,
    val error: ErrorDetails? = null,
    val code: String? = null,
    val message: String? = null,
    val timestamp: String? = null
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
    val user: UserProfile,
    val token: String
)

data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("fullName") val fullName: String,
    val role: String = "LEARNER"
)

data class RegisterResponse(
    val user: UserProfile,
    val token: String
)

// ============================================
// User/Profile Models (matches Spring Boot UserDto)
// ============================================

data class UserProfile(
    val id: String,
    val email: String,
    @SerializedName("fullName") val fullName: String,
    val role: String,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    val phone: String? = null,
    val bio: String? = null,
    @SerializedName("degreeProgram") val degreeProgram: String? = null,
    @SerializedName("yearLevel") val yearLevel: Int? = null,
    val rating: Double? = null,
    @SerializedName("totalSessions") val totalSessions: Int? = null,
    @SerializedName("isProfileComplete") val isProfileComplete: Boolean = false
)

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
    @SerializedName("scheduledAt") val scheduledAt: String,
    @SerializedName("durationMinutes") val durationMinutes: Int = 60,
    val status: String,
    val topic: String? = null,
    val notes: String? = null,
    val location: String? = null,
    @SerializedName("specializationName") val specializationName: String? = null,
    val rating: RatingDto? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

// Legacy alias
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
// Repository Models (matches Spring Boot RepositoryDtos)
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

data class CreateRepositoryRequest(
    val title: String,
    val description: String? = null,
    val visibility: String = "private"
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

data class CreateResourceRequest(
    val title: String,
    val description: String? = null,
    val url: String? = null,
    @SerializedName("fileType") val fileType: String? = null,
    @SerializedName("fileSize") val fileSize: Long? = null
)

data class RepositoryListResponse(
    val repositories: List<RepositoryDto>
)

data class ResourceListResponse(
    val resources: List<ResourceDto>
)

// ============================================
// Dashboard Models (computed from sessions)
// ============================================

data class DashboardStats(
    @SerializedName("totalSessions") val totalSessions: Int = 0,
    @SerializedName("upcomingSessions") val upcomingSessions: Int = 0,
    @SerializedName("completedSessions") val completedSessions: Int = 0,
    @SerializedName("totalStudySets") val totalStudySets: Int = 0,
    @SerializedName("averageQuizScore") val averageQuizScore: Double = 0.0
)

// ============================================
// Admin Models (matches Spring Boot AdminController)
// ============================================

data class RegisterCardRequest(
    @SerializedName("cardId") val cardId: String,
    val pin: String,
    @SerializedName("userId") val userId: String
)

data class DeviceTokenRequest(
    @SerializedName("deviceType") val deviceType: String,
    val token: String
)

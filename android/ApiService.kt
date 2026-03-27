package com.example.scholarme.api

import retrofit2.Response
import retrofit2.http.*
import com.google.gson.JsonObject

interface ApiService {

    // Auth Endpoints
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("auth/profile")
    suspend fun getProfile(): Response<ProfileResponse>

    @PUT("auth/update-profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<UpdateProfileResponse>

    @POST("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<JsonObject>
}

// Request Data Classes
data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val phoneNumber: String,
    val accountType: String = "learner"
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class UpdateProfileRequest(
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val birthdate: String? = null,
    val bio: String? = null
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

// Response Data Classes
data class AuthResponse(
    val success: Boolean,
    val message: String,
    val data: RegisterData? = null,
    val errorCode: String? = null
)

data class RegisterData(
    val userId: String,
    val email: String,
    val requiresVerification: Boolean
)

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val data: LoginData? = null,
    val errorCode: String? = null
)

data class LoginData(
    val userId: String,
    val email: String,
    val session: String,
    val profile: ProfileData
)

data class ProfileData(
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val avatarUrl: String? = null,
    val phoneNumber: String? = null,
    val birthdate: String? = null
)

data class ProfileResponse(
    val success: Boolean,
    val data: UserProfile? = null
)

data class UserProfile(
    val userId: String,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String? = null,
    val birthdate: String? = null,
    val avatarUrl: String? = null,
    val accountType: String,
    val profileCompleted: Boolean,
    val createdAt: String,
    val tutorStats: TutorStats? = null
)

data class TutorStats(
    val rating: Float,
    val totalRatings: Int,
    val yearsExperience: Int? = null,
    val hourlyRate: Double? = null
)

data class UpdateProfileResponse(
    val success: Boolean,
    val message: String,
    val data: UpdatedProfileData? = null
)

data class UpdatedProfileData(
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val phoneNumber: String? = null,
    val birthdate: String? = null
)

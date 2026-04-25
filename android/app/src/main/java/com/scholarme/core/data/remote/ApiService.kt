package com.scholarme.core.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.core.data.model.AvailabilityDto
import com.scholarme.core.data.model.CardLoginRequest
import com.scholarme.core.data.model.ChangePasswordRequest
import com.scholarme.core.data.model.CreateRepositoryRequest
import com.scholarme.core.data.model.CreateResourceRequest
import com.scholarme.core.data.model.CreateSessionRequest
import com.scholarme.core.data.model.DashboardStats
import com.scholarme.core.data.model.DeviceTokenRequest
import com.scholarme.core.data.model.EmailLoginRequest
import com.scholarme.core.data.model.LoginResponse
import com.scholarme.core.data.model.RateSessionRequest
import com.scholarme.core.data.model.RegisterCardRequest
import com.scholarme.core.data.model.RegisterRequest
import com.scholarme.core.data.model.RegisterResponse
import com.scholarme.core.data.model.RepositoryDto
import com.scholarme.core.data.model.RepositoryListResponse
import com.scholarme.core.data.model.ResourceDto
import com.scholarme.core.data.model.ResourceListResponse
import com.scholarme.core.data.model.SessionDto
import com.scholarme.core.data.model.SpecializationDto
import com.scholarme.core.data.model.TutorDto
import com.scholarme.core.data.model.TutorListResponse
import com.scholarme.core.data.model.UpdateProfileRequest
import com.scholarme.core.data.model.UpdateSessionStatusRequest
import com.scholarme.core.data.model.UserProfile
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API Service interface.
 * Defines all API endpoints matching the Spring Boot backend.
 * Base URL: https://api.scholarme.app/api/v1
 */
interface ApiService {
    
    // ============================================
    // Auth Endpoints
    // ============================================
    
    @POST("auth/card-login")
    suspend fun cardLogin(
        @Body request: CardLoginRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @POST("auth/email-login")
    suspend fun login(
        @Body request: EmailLoginRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @POST("auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<ApiResponse<RegisterResponse>>
    
    @POST("auth/logout")
    suspend fun logout(
        @Header("Authorization") token: String
    ): Response<ApiResponse<Map<String, String>>>
    
    @POST("auth/refresh")
    suspend fun refreshToken(
        @Body request: RefreshTokenRequest
    ): Response<ApiResponse<LoginResponse>>
    
    // ============================================
    // User/Profile Endpoints
    // ============================================
    
    @GET("users/me")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<ApiResponse<UserProfile>>
    
    @PUT("users/me")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): Response<ApiResponse<UserProfile>>
    
    @POST("users/me/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<ApiResponse<Map<String, String>>>
    
    @POST("users/{id}/device-token")
    suspend fun registerDeviceToken(
        @Header("Authorization") token: String,
        @Path("id") userId: String,
        @Body request: DeviceTokenRequest
    ): Response<ApiResponse<Map<String, String>>>
    
    // ============================================
    // Tutor Endpoints
    // ============================================
    
    @GET("tutors")
    suspend fun getTutors(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("specialization") specializationId: String? = null
    ): Response<ApiResponse<TutorListResponse>>
    
    @GET("tutors/{id}")
    suspend fun getTutor(
        @Path("id") tutorId: String
    ): Response<ApiResponse<TutorDto>>
    
    @GET("tutors/{id}/availability")
    suspend fun getTutorAvailability(
        @Path("id") tutorId: String
    ): Response<ApiResponse<List<AvailabilityDto>>>
    
    @POST("tutors/availability")
    suspend fun updateAvailability(
        @Header("Authorization") token: String,
        @Body request: List<AvailabilityDto>
    ): Response<ApiResponse<List<AvailabilityDto>>>
    
    // ============================================
    // Session Endpoints
    // ============================================
    
    @GET("sessions")
    suspend fun getSessions(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("role") role: String? = null
    ): Response<ApiResponse<List<SessionDto>>>
    
    @GET("sessions/{id}")
    suspend fun getSession(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String
    ): Response<ApiResponse<SessionDto>>
    
    @POST("sessions")
    suspend fun createSession(
        @Header("Authorization") token: String,
        @Body request: CreateSessionRequest
    ): Response<ApiResponse<SessionDto>>
    
    @PUT("sessions/{id}/status")
    suspend fun updateSessionStatus(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String,
        @Body request: UpdateSessionStatusRequest
    ): Response<ApiResponse<SessionDto>>
    
    @POST("sessions/{id}/rate")
    suspend fun rateSession(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String,
        @Body request: RateSessionRequest
    ): Response<ApiResponse<Map<String, String>>>
    
    // ============================================
    // Specialization Endpoints
    // ============================================
    
    @GET("specializations")
    suspend fun getSpecializations(): Response<ApiResponse<List<SpecializationDto>>>
    
    // ============================================
    // Repository Endpoints
    // ============================================
    
    @GET("repositories")
    suspend fun getRepositories(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null
    ): Response<ApiResponse<RepositoryListResponse>>
    
    @GET("repositories/{id}")
    suspend fun getRepository(
        @Header("Authorization") token: String,
        @Path("id") repoId: String
    ): Response<ApiResponse<RepositoryDto>>
    
    @POST("repositories")
    suspend fun createRepository(
        @Header("Authorization") token: String,
        @Body request: CreateRepositoryRequest
    ): Response<ApiResponse<RepositoryDto>>
    
    @GET("repositories/{id}/resources")
    suspend fun getResources(
        @Header("Authorization") token: String,
        @Path("id") repoId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<ApiResponse<ResourceListResponse>>
    
    @POST("repositories/{id}/resources")
    suspend fun addResource(
        @Header("Authorization") token: String,
        @Path("id") repoId: String,
        @Body request: CreateResourceRequest
    ): Response<ApiResponse<ResourceDto>>
    
    // ============================================
    // Admin Endpoints
    // ============================================
    
    @GET("admin/users")
    suspend fun getUsers(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("role") role: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<UserProfile>>>
    
    @POST("admin/users")
    suspend fun createUser(
        @Header("Authorization") token: String,
        @Body request: RegisterRequest
    ): Response<ApiResponse<UserProfile>>
    
    @PUT("admin/users/{id}/role")
    suspend fun updateUserRole(
        @Header("Authorization") token: String,
        @Path("id") userId: String,
        @Body request: Map<String, String>
    ): Response<ApiResponse<UserProfile>>
    
    @POST("admin/credentials/issue")
    suspend fun issueCredentials(
        @Header("Authorization") token: String,
        @Body request: RegisterCardRequest
    ): Response<ApiResponse<Map<String, String>>>
    
    @DELETE("admin/credentials/{cardId}")
    suspend fun revokeCredentials(
        @Header("Authorization") token: String,
        @Path("cardId") cardId: String
    ): Response<ApiResponse<Map<String, String>>>
    
    @GET("admin/analytics/overview")
    suspend fun getAnalyticsOverview(
        @Header("Authorization") token: String
    ): Response<ApiResponse<Map<String, Any>>>
    
    // ============================================
    // Dashboard Endpoints
    // ============================================
    
    @GET("dashboard/stats")
    suspend fun getDashboardStats(
        @Header("Authorization") token: String
    ): Response<ApiResponse<DashboardStats>>
    
    @GET("sessions")
    suspend fun getUpcomingSessions(
        @Header("Authorization") token: String,
        @Query("status") status: String = "PENDING"
    ): Response<ApiResponse<List<SessionDto>>>
}

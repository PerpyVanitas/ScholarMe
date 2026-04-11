package com.scholarme.core.data.remote

import com.scholarme.core.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API Service interface.
 * Defines all API endpoints for the ScholarMe Android app.
 */
interface ApiService {
    
    // ============================================
    // Auth Endpoints
    // ============================================
    
    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @POST("auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<ApiResponse<RegisterResponse>>
    
    // ============================================
    // Profile Endpoints
    // ============================================
    
    @GET("auth/profile")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<ApiResponse<UserProfile>>
    
    @PUT("auth/update-profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): Response<ApiResponse<UserProfile>>
    
    @POST("auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<ApiResponse<Unit>>
    
    // ============================================
    // Dashboard Endpoints
    // ============================================
    
    @GET("dashboard/stats")
    suspend fun getDashboardStats(
        @Header("Authorization") token: String
    ): Response<ApiResponse<DashboardStats>>
    
    @GET("dashboard/sessions")
    suspend fun getUpcomingSessions(
        @Header("Authorization") token: String
    ): Response<ApiResponse<List<Session>>>
}

package com.scholarme.features.profile.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.profile.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ProfileApi {
    @GET("auth/profile")
    suspend fun getProfile(): Response<ApiResponse<UserProfile>>
    
    @PUT("auth/update-profile")
    suspend fun updateProfile(
        @Body request: UpdateProfileRequest
    ): Response<ApiResponse<UserProfile>>
    
    @POST("auth/change-password")
    suspend fun changePassword(
        @Body request: ChangePasswordRequest
    ): Response<ApiResponse<Map<String, String>>>
    
    @POST("users/{id}/device-token")
    suspend fun registerDeviceToken(
        @Path("id") userId: String,
        @Body request: Map<String, String>
    ): Response<ApiResponse<Map<String, String>>>
}

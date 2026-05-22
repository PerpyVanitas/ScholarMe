package com.scholarme.features.auth.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.auth.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/card-login")
    suspend fun cardLogin(
        @Body request: CardLoginRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @POST("auth/login")
    suspend fun login(
        @Body request: EmailLoginRequest
    ): Response<ApiResponse<LoginResponse>>
    
    @POST("auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<ApiResponse<RegisterResponse>>
    
    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Map<String, String>>>
}
    @POST("auth/refresh")
    suspend fun refreshToken(
        @Body request: RefreshRequest
    ): Response<ApiResponse<LoginResponse>>
}

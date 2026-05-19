package com.scholarme.features.sessions.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.sessions.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface SessionApi {
    @GET("sessions")
    suspend fun getSessions(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("status") status: String? = null
    ): Response<ApiResponse<SessionListResponse>>
    
    @GET("sessions/{id}")
    suspend fun getSession(
        @Path("id") sessionId: String
    ): Response<ApiResponse<SessionDto>>
    
    @POST("sessions")
    suspend fun createSession(
        @Body request: CreateSessionRequest
    ): Response<ApiResponse<SessionDto>>
    
    @PUT("sessions/{id}/status")
    suspend fun updateSessionStatus(
        @Path("id") sessionId: String,
        @Body request: UpdateSessionStatusRequest
    ): Response<ApiResponse<SessionDto>>
    
    @POST("sessions/{id}/rate")
    suspend fun rateSession(
        @Path("id") sessionId: String,
        @Body request: RateSessionRequest
    ): Response<ApiResponse<Map<String, String>>>
}

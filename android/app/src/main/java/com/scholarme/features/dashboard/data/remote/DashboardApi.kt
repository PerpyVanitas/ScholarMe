package com.scholarme.features.dashboard.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.dashboard.data.model.DashboardStats
import com.scholarme.features.sessions.data.model.SessionListResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface DashboardApi {
    @GET("dashboard/stats")
    suspend fun getDashboardStats(): Response<ApiResponse<DashboardStats>>
    
    @GET("sessions")
    suspend fun getUpcomingSessions(
        @Query("status") status: String = "PENDING"
    ): Response<ApiResponse<SessionListResponse>>
}

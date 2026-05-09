package com.scholarme.features.admin.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.admin.data.model.*
import com.scholarme.features.auth.data.model.AuthCard
import com.scholarme.features.profile.data.model.UserProfile
import retrofit2.Response
import retrofit2.http.*

interface AdminApi {
    @GET("admin/analytics")
    suspend fun getAdminAnalytics(): Response<ApiResponse<AdminAnalytics>>

    @GET("admin/timesheets")
    suspend fun getAdminTimesheets(): Response<ApiResponse<List<AdminTimesheet>>>

    @POST("admin/timesheets/{id}/approve")
    suspend fun approveTimesheet(
        @Path("id") id: String,
        @Body status: Map<String, String>
    ): Response<ApiResponse<Unit>>

    @GET("admin/users/{id}/logs")
    suspend fun getUserAuditLogs(
        @Path("id") id: String
    ): Response<ApiResponse<List<AuditLogEntry>>>

    @GET("admin/cards")
    suspend fun getAdminCards(): Response<ApiResponse<List<AuthCard>>>

    @POST("admin/cards/issue")
    suspend fun issueCard(
        @Body request: Map<String, String>
    ): Response<ApiResponse<Unit>>
    
    @GET("admin/users")
    suspend fun getUsers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("role") role: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<UserProfile>>>
}

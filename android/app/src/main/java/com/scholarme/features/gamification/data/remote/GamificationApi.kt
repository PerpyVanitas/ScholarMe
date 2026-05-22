package com.scholarme.features.gamification.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.gamification.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface GamificationApi {
    @GET("gamification/leaderboard")
    suspend fun getLeaderboard(
        @Query("limit") limit: Int = 50
    ): Response<ApiResponse<LeaderboardResponse>>
    
    @POST("api/xp/earn")
    suspend fun awardXp(
        @Body request: Map<String, @JvmSuppressWildcards Any>
    ): Response<XpAwardResponse>
}

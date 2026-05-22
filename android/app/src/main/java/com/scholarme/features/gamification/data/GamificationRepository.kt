package com.scholarme.features.gamification.data

import com.scholarme.features.gamification.data.model.*
import com.scholarme.features.gamification.data.remote.GamificationApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class GamificationRepository @Inject constructor(
    private val gamificationApi: GamificationApi
) {
    
    suspend fun getLeaderboard(limit: Int = 50): Result<LeaderboardResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = gamificationApi.getLeaderboard(limit)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data!!)
                } else {
                    Result.Error("Failed to fetch leaderboard")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error")
            }
        }
    }

    suspend fun awardXp(xpAmount: Int, reason: String): Result<XpAwardResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = gamificationApi.awardXp(mapOf("amount" to xpAmount, "reason" to reason))
                val body = response.body()
                if (response.isSuccessful && body?.success == true) {
                    Result.Success(body)
                } else {
                    Result.Error("Failed to award XP")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error")
            }
        }
    }
}


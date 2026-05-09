package com.scholarme.features.gamification.data

import com.scholarme.core.data.model.LeaderboardResponse
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class GamificationRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getLeaderboard(limit: Int = 50): Result<LeaderboardResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getLeaderboard(limit)
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
                val response = apiService.awardXp(XpAwardRequest(xpAmount, reason))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data!!)
                } else {
                    Result.Error("Failed to award XP")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error")
            }
        }
    }
}

data class XpAwardRequest(val xpAmount: Int, val reason: String)
data class XpAwardResponse(
    val newXp: Int,
    val newLevel: Int,
    val leveledUp: Boolean,
    val xpEarned: Int
)

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
                val response = gamificationApi.awardXp(mapOf("xpAmount" to xpAmount, "reason" to reason))
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data as? Map<String, Any>
                    if (data != null) {
                         val result = XpAwardResponse(
                             newXp = (data["newXp"] as? Double)?.toInt() ?: 0,
                             newLevel = (data["newLevel"] as? Double)?.toInt() ?: 1,
                             leveledUp = data["leveledUp"] as? Boolean ?: false,
                             xpEarned = (data["xpEarned"] as? Double)?.toInt() ?: 0
                         )
                        Result.Success(result)
                    } else {
                        Result.Error("Empty response")
                    }
                } else {
                    Result.Error("Failed to award XP")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error")
            }
        }
    }
}


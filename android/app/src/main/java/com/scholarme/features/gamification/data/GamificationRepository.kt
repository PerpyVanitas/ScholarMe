package com.scholarme.features.gamification.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

data class LeaderboardUserDto(
    val rank: Int,
    val id: String,
    val fullName: String,
    val avatarUrl: String?,
    val totalXp: Int,
    val currentLevel: Int,
    val profileThemeColor: String?,
    val isCurrentUser: Boolean = false
)

class GamificationRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    // Secondary constructor for non-Hilt usage
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getLeaderboard(limit: Int = 50): NetworkResult<List<LeaderboardUserDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.getLeaderboard(token, limit)
                if (response.isSuccessful && response.body()?.success == true) {
                    val entries = response.body()?.data?.leaderboard ?: emptyList()
                    NetworkResult.Success(entries.map { e ->
                        LeaderboardUserDto(
                            rank = e.rank,
                            id = e.id,
                            fullName = e.fullName,
                            avatarUrl = e.avatarUrl,
                            totalXp = e.totalXp,
                            currentLevel = e.currentLevel,
                            profileThemeColor = e.profileThemeColor,
                            isCurrentUser = e.isCurrentUser
                        )
                    })
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to load leaderboard")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }
}

package com.scholarme.features.gamification.data

import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import javax.inject.Inject

data class LeaderboardUserDto(
    val id: String,
    val fullName: String,
    val avatarUrl: String?,
    val totalXp: Int,
    val currentLevel: Int,
    val profileThemeColor: String?
)

class GamificationRepository @Inject constructor() {
    
    // Mock leaderboard data for UI validation before backend API is ready
    private val mockLeaderboard = listOf(
        LeaderboardUserDto("1", "Ada Lovelace", null, 15420, 16, "gold"),
        LeaderboardUserDto("2", "Alan Turing", null, 14200, 15, "purple"),
        LeaderboardUserDto("3", "Grace Hopper", null, 12500, 13, "ruby"),
        LeaderboardUserDto("me", "Van Woodroe", null, 8400, 9, "emerald"), // Current User Mock
        LeaderboardUserDto("4", "Margaret Hamilton", null, 4200, 5, null),
        LeaderboardUserDto("5", "Katherine Johnson", null, 1200, 2, null)
    ).sortedByDescending { it.totalXp }

    suspend fun getLeaderboard(): NetworkResult<List<LeaderboardUserDto>> {
        return withContext(Dispatchers.IO) {
            delay(600) // Simulate network latency
            NetworkResult.Success(mockLeaderboard)
        }
    }
}

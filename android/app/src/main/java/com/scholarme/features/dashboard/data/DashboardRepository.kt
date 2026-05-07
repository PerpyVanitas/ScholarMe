package com.scholarme.features.dashboard.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.AndroidDashboardStats
import com.scholarme.core.data.model.AndroidSessionDto
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

// Type aliases to keep DashboardActivity working without changes
typealias DashboardStats = AndroidDashboardStats
typealias Session = AndroidSessionDto

/**
 * Repository for dashboard data operations.
 * Connects to /api/android/dashboard/stats and /api/android/sessions.
 */
class DashboardRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    // Legacy constructor for non-Hilt (DashboardActivity uses ViewModelFactory)
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getDashboardStats(): Result<DashboardStats> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext Result.Error("Not authenticated")

                val response = apiService.getDashboardStats(token)

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    Result.Success(data ?: AndroidDashboardStats())
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Failed to load stats"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getUpcomingSessions(): Result<List<Session>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext Result.Error("Not authenticated")

                val response = apiService.getSessions(token, status = "pending,confirmed")

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data?.sessions ?: emptyList()
                    Result.Success(data)
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Failed to load sessions"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    fun getUserName(): String = tokenManager.getUserName() ?: "User"
    fun getUserRole(): String = tokenManager.getUserRole() ?: "learner"
}

package com.scholarme.features.dashboard.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.dashboard.data.model.DashboardStats
import com.scholarme.features.sessions.data.model.SessionDto
import com.scholarme.features.dashboard.data.remote.DashboardApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for dashboard data operations.
 */
class DashboardRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val dashboardApi: DashboardApi
) {
    
    suspend fun getDashboardStats(): Result<DashboardStats> {
        return withContext(Dispatchers.IO) {
            try {
                if (!tokenManager.isLoggedIn()) return@withContext Result.Error("Not authenticated")
                
                val response = dashboardApi.getDashboardStats()
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        Result.Success(data)
                    } else {
                        Result.Success(DashboardStats())
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Failed to load stats"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
    
    suspend fun getUpcomingSessions(): Result<List<SessionDto>> {
        return withContext(Dispatchers.IO) {
            try {
                if (!tokenManager.isLoggedIn()) return@withContext Result.Error("Not authenticated")
                
                val response = dashboardApi.getUpcomingSessions()
                
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

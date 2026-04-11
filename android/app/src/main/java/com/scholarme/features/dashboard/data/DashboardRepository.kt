package com.scholarme.features.dashboard.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.DashboardStats
import com.scholarme.core.data.model.Session
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for dashboard data operations.
 */
class DashboardRepository(private val tokenManager: TokenManager) {
    
    private val apiService = ApiClient.apiService
    
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
                    if (data != null) {
                        Result.Success(data)
                    } else {
                        Result.Success(DashboardStats()) // Return empty stats
                    }
                } else {
                    val errorMsg = response.body()?.message ?: "Failed to load stats"
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
                
                val response = apiService.getUpcomingSessions(token)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data ?: emptyList()
                    Result.Success(data)
                } else {
                    val errorMsg = response.body()?.message ?: "Failed to load sessions"
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

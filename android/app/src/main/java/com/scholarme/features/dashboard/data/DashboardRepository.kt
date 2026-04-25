package com.scholarme.features.dashboard.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.DashboardStats
import com.scholarme.core.data.model.SessionDto
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.network.toNetworkResultWithData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for dashboard data operations (Vertical Slice — Dashboard Feature).
 *
 * Migrated from core.util.Result → core.network.NetworkResult for consistency
 * with the rest of the architecture. Token is injected via AuthInterceptor on
 * the OkHttpClient — manual "Bearer $token" header is kept for endpoints that
 * require it explicitly (API contract).
 */
class DashboardRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getDashboardStats(): NetworkResult<DashboardStats> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Unauthorized("Not authenticated")

                apiService.getDashboardStats(token)
                    .toNetworkResultWithData { it.data ?: DashboardStats() }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred", exception = e)
            }
        }
    }

    suspend fun getUpcomingSessions(): NetworkResult<List<SessionDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Unauthorized("Not authenticated")

                apiService.getUpcomingSessions(token)
                    .toNetworkResultWithData { it.data ?: emptyList() }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred", exception = e)
            }
        }
    }

    fun getUserName(): String = tokenManager.getUserName() ?: "User"
    fun getUserRole(): String = tokenManager.getUserRole() ?: "learner"
}

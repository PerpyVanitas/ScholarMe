package com.scholarme.features.dashboard.data.repository

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.local.dao.DashboardDao
import com.scholarme.features.dashboard.data.remote.DashboardApi
import com.scholarme.core.util.Result
import com.scholarme.features.dashboard.data.mapper.toDomain
import com.scholarme.features.dashboard.data.mapper.toEntity
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.features.dashboard.domain.model.Session
import com.scholarme.features.dashboard.domain.repository.DashboardRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

class DashboardRepositoryImpl @Inject constructor(
    private val tokenManager: TokenManager,
    private val dashboardApi: DashboardApi,
    private val dashboardDao: DashboardDao
) : DashboardRepository {

    override fun getDashboardStats(): Flow<Result<DashboardStats>> = flow {
        emit(Result.Loading)

        try {
            val cached = dashboardDao.observeDashboardStats().firstOrNull()
            if (cached != null) {
                emit(Result.Success(cached.toDomain()))
            }

            val response = dashboardApi.getDashboardStats()
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data ?: com.scholarme.features.dashboard.data.model.DashboardStats()
                dashboardDao.insertDashboardStats(data.toEntity())
                emit(Result.Success(data.toEntity().toDomain()))
            } else if (cached == null) {
                emit(Result.Error(response.body()?.error?.message ?: "Failed to fetch stats"))
            }
        } catch (e: Exception) {
            emit(Result.Error(e.message ?: "Network error occurred"))
        }
    }

    override fun getUpcomingSessions(): Flow<Result<List<Session>>> = flow {
        emit(Result.Loading)

        try {
            val cached = dashboardDao.observeUpcomingSessions().firstOrNull()
            if (!cached.isNullOrEmpty()) {
                emit(Result.Success(cached.map { it.toDomain() }))
            }

            val response = dashboardApi.getUpcomingSessions()
            if (response.isSuccessful && response.body()?.success == true) {
                val sessions = response.body()?.data?.sessions ?: emptyList()
                dashboardDao.updateSessions(sessions.map { it.toEntity() })
                emit(Result.Success(sessions.map { it.toEntity().toDomain() }))
            } else if (cached.isNullOrEmpty()) {
                emit(Result.Error(response.body()?.error?.message ?: "Failed to fetch sessions"))
            }
        } catch (e: Exception) {
            emit(Result.Error(e.message ?: "Network error occurred"))
        }
    }

    override fun getUserName(): String = tokenManager.getUserName() ?: "User"
    override fun getUserRole(): String = tokenManager.getUserRole() ?: "learner"
}

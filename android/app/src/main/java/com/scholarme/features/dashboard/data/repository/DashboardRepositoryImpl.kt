package com.scholarme.features.dashboard.data.repository

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.local.dao.DashboardDao
import com.scholarme.features.dashboard.data.remote.DashboardApi
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.network.toNetworkResultWithData
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

    override fun getDashboardStats(): Flow<NetworkResult<DashboardStats>> = flow {
        emit(NetworkResult.Loading())

        try {
            val cached = dashboardDao.observeDashboardStats().firstOrNull()
            if (cached != null) {
                emit(NetworkResult.Success(cached.toDomain()))
            }

            val remoteResponse = dashboardApi.getDashboardStats()
            val remoteResult = remoteResponse.toNetworkResultWithData { it.data ?: com.scholarme.features.dashboard.data.model.DashboardStats() }

            if (remoteResult is NetworkResult.Success) {
                dashboardDao.insertDashboardStats(remoteResult.data.toEntity())
                val fresh = dashboardDao.observeDashboardStats().firstOrNull()
                if (fresh != null) {
                    emit(NetworkResult.Success(fresh.toDomain()))
                }
            } else if (remoteResult is NetworkResult.Error && cached == null) {
                emit(NetworkResult.Error(remoteResult.message, remoteResult.code, remoteResult.apiError, remoteResult.exception))
            } else if (remoteResult is NetworkResult.Unauthorized) {
                emit(NetworkResult.Unauthorized(remoteResult.message, remoteResult.exception))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error(e.message ?: "Network error occurred", exception = e))
        }
    }

    override fun getUpcomingSessions(): Flow<NetworkResult<List<Session>>> = flow {
        emit(NetworkResult.Loading())

        try {
            val cached = dashboardDao.observeUpcomingSessions().firstOrNull()
            if (!cached.isNullOrEmpty()) {
                emit(NetworkResult.Success(cached.map { it.toDomain() }))
            }

            val remoteResponse = dashboardApi.getUpcomingSessions()
            val remoteResult = remoteResponse.toNetworkResultWithData { it.data?.sessions ?: emptyList() }

            if (remoteResult is NetworkResult.Success) {
                dashboardDao.updateSessions(remoteResult.data.map { it.toEntity() })
                val fresh = dashboardDao.observeUpcomingSessions().firstOrNull()
                if (fresh != null) {
                    emit(NetworkResult.Success(fresh.map { it.toDomain() }))
                }
            } else if (remoteResult is NetworkResult.Error && cached.isNullOrEmpty()) {
                emit(NetworkResult.Error(remoteResult.message, remoteResult.code, remoteResult.apiError, remoteResult.exception))
            } else if (remoteResult is NetworkResult.Unauthorized) {
                 emit(NetworkResult.Unauthorized(remoteResult.message, remoteResult.exception))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error(e.message ?: "Network error occurred", exception = e))
        }
    }

    override fun getUserName(): String = tokenManager.getUserName() ?: "User"
    override fun getUserRole(): String = tokenManager.getUserRole() ?: "learner"
}

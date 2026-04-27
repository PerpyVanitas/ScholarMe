package com.scholarme.features.dashboard.domain.repository

import com.scholarme.core.network.NetworkResult
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.features.dashboard.domain.model.Session
import kotlinx.coroutines.flow.Flow

interface DashboardRepository {
    fun getDashboardStats(): Flow<NetworkResult<DashboardStats>>
    fun getUpcomingSessions(): Flow<NetworkResult<List<Session>>>
    fun getUserName(): String
    fun getUserRole(): String
}

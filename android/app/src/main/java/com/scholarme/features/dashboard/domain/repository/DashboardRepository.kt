package com.scholarme.features.dashboard.domain.repository

import com.scholarme.core.util.Result
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.features.dashboard.domain.model.Session
import kotlinx.coroutines.flow.Flow

interface DashboardRepository {
    fun getDashboardStats(): Flow<Result<DashboardStats>>
    fun getUpcomingSessions(): Flow<Result<List<Session>>>
    fun getUserName(): String
    fun getUserRole(): String
}

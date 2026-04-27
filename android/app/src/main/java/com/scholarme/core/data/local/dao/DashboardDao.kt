package com.scholarme.core.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.scholarme.core.data.local.entity.DashboardStatsEntity
import com.scholarme.core.data.local.entity.SessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DashboardDao {
    @Query("SELECT * FROM dashboard_stats WHERE id = 1")
    fun observeDashboardStats(): Flow<DashboardStatsEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDashboardStats(stats: DashboardStatsEntity)

    @Query("SELECT * FROM sessions ORDER BY scheduledAt ASC")
    fun observeUpcomingSessions(): Flow<List<SessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSessions(sessions: List<SessionEntity>)

    @Query("DELETE FROM sessions")
    suspend fun clearSessions()

    @Transaction
    suspend fun updateSessions(sessions: List<SessionEntity>) {
        clearSessions()
        insertSessions(sessions)
    }
}

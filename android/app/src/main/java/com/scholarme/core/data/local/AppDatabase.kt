package com.scholarme.core.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.scholarme.core.data.local.dao.DashboardDao
import com.scholarme.core.data.local.entity.DashboardStatsEntity
import com.scholarme.core.data.local.entity.SessionEntity

@Database(
    entities = [
        DashboardStatsEntity::class,
        SessionEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dashboardDao(): DashboardDao
}

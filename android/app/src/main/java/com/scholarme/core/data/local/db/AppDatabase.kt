package com.scholarme.core.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.scholarme.core.data.local.dao.DashboardDao
import com.scholarme.core.data.local.entity.DashboardStatsEntity
import com.scholarme.core.data.local.entity.SessionEntity

@Database(
    entities = [
        StudySetEntity::class, 
        StudyItemEntity::class, 
        ResourceEntity::class,
        DashboardStatsEntity::class,
        SessionEntity::class
    ], 
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun offlineDao(): OfflineDao
    abstract fun dashboardDao(): DashboardDao
}

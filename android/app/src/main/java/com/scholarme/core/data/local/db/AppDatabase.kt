package com.scholarme.core.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        StudySetEntity::class, 
        StudyItemEntity::class, 
        ResourceEntity::class
    ], 
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun offlineDao(): OfflineDao
}

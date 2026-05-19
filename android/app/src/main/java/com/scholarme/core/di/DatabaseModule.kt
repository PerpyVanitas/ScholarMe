package com.scholarme.core.di

import android.content.Context
import androidx.room.Room
import com.scholarme.core.data.local.db.AppDatabase
import com.scholarme.core.data.local.db.OfflineDao
import com.scholarme.core.data.local.dao.DashboardDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "scholarme_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideOfflineDao(database: AppDatabase): OfflineDao {
        return database.offlineDao()
    }

    @Provides
    fun provideDashboardDao(database: AppDatabase): DashboardDao {
        return database.dashboardDao()
    }
}

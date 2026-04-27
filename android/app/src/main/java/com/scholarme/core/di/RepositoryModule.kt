package com.scholarme.core.di

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiService
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.dashboard.domain.repository.DashboardRepository
import com.scholarme.features.dashboard.data.repository.DashboardRepositoryImpl
import com.scholarme.core.data.local.dao.DashboardDao
import com.scholarme.features.profile.data.ProfileRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module providing repository dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: ApiService,
        tokenManager: TokenManager
    ): AuthRepository {
        return AuthRepository(tokenManager, apiService)
    }

    @Provides
    @Singleton
    fun provideDashboardRepository(
        apiService: ApiService,
        tokenManager: TokenManager,
        dashboardDao: DashboardDao
    ): DashboardRepository {
        return DashboardRepositoryImpl(tokenManager, apiService, dashboardDao)
    }

    @Provides
    @Singleton
    fun provideProfileRepository(
        apiService: ApiService,
        tokenManager: TokenManager
    ): ProfileRepository {
        return ProfileRepository(tokenManager, apiService)
    }
}

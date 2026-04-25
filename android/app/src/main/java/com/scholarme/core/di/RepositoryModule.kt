package com.scholarme.core.di

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiService
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.dashboard.data.DashboardRepository
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
        tokenManager: TokenManager
    ): DashboardRepository {
        return DashboardRepository(tokenManager, apiService)
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

package com.scholarme.core.di

import com.scholarme.core.auth.SessionValidator
import com.scholarme.core.auth.LogoutHandler
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
 * All repositories are scoped to the application lifecycle (SingletonComponent).
 */
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: ApiService,
        tokenManager: TokenManager,
        sessionValidator: SessionValidator
    ): AuthRepository {
        return AuthRepository(tokenManager, sessionValidator, apiService)
    }

    @Provides
    @Singleton
    fun provideLogoutHandler(authRepository: AuthRepository): LogoutHandler {
        return authRepository
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

package com.scholarme.core.di

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.local.db.OfflineDao
import com.scholarme.features.admin.data.AdminRepository
import com.scholarme.features.admin.data.remote.AdminApi
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.auth.data.remote.AuthApi
import com.scholarme.features.dashboard.data.DashboardRepository
import com.scholarme.features.dashboard.data.remote.DashboardApi
import com.scholarme.features.gamification.data.GamificationRepository
import com.scholarme.features.gamification.data.remote.GamificationApi
import com.scholarme.features.messaging.data.MessagingRepository
import com.scholarme.features.messaging.data.remote.MessagingApi
import com.scholarme.features.profile.data.ProfileRepository
import com.scholarme.features.profile.data.remote.ProfileApi
import com.scholarme.features.quizzes.data.QuizRepository
import com.scholarme.features.quizzes.data.remote.QuizApi
import com.scholarme.features.sessions.data.SessionRepository
import com.scholarme.features.sessions.data.remote.SessionApi
import com.scholarme.features.tutors.data.TutorRepository
import com.scholarme.features.tutors.data.remote.TutorApi
import com.scholarme.features.voting.data.VotingRepository
import com.scholarme.features.voting.data.remote.VotingApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides @Singleton fun provideAuthRepository(api: AuthApi, tokenManager: TokenManager) = AuthRepository(tokenManager, api)
    @Provides @Singleton fun provideProfileRepository(api: ProfileApi, tokenManager: TokenManager) = ProfileRepository(tokenManager, api)
    @Provides @Singleton fun provideDashboardRepository(api: DashboardApi, tokenManager: TokenManager) = DashboardRepository(tokenManager, api)
    @Provides @Singleton fun provideTutorRepository(api: TutorApi) = TutorRepository(api)
    @Provides @Singleton fun provideSessionRepository(api: SessionApi) = SessionRepository(api)
    @Provides @Singleton fun provideAdminRepository(api: AdminApi) = AdminRepository(api)
    @Provides @Singleton fun provideGamificationRepository(api: GamificationApi) = GamificationRepository(api)
    @Provides @Singleton fun provideQuizRepository(api: QuizApi, dao: OfflineDao) = QuizRepository(api, dao)
    @Provides @Singleton fun provideMessagingRepository(api: MessagingApi) = MessagingRepository(api)
    @Provides @Singleton fun provideVotingRepository(api: VotingApi) = VotingRepository(api)
}

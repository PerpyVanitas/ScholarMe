package com.scholarme.core.di

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.scholarme.BuildConfig
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.AuthInterceptor
import com.scholarme.core.data.remote.NetworkErrorInterceptor
import com.scholarme.features.admin.data.remote.AdminApi
import com.scholarme.features.auth.data.remote.AuthApi
import com.scholarme.features.dashboard.data.remote.DashboardApi
import com.scholarme.features.gamification.data.remote.GamificationApi
import com.scholarme.features.notifications.data.remote.NotificationApi
import com.scholarme.features.profile.data.remote.ProfileApi
import com.scholarme.features.quizzes.data.remote.QuizApi
import com.scholarme.features.resources.data.remote.ResourceApi
import com.scholarme.features.sessions.data.remote.SessionApi
import com.scholarme.features.tutors.data.remote.TutorApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    @Provides
    @Singleton
    fun provideTokenManager(@ApplicationContext context: Context): TokenManager {
        return TokenManager.getInstance(context)
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenManager: TokenManager): AuthInterceptor {
        return AuthInterceptor(tokenManager)
    }
    
    @Provides
    @Singleton
    fun provideNetworkErrorInterceptor(): NetworkErrorInterceptor {
        return NetworkErrorInterceptor()
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        networkErrorInterceptor: NetworkErrorInterceptor
    ): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(networkErrorInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, gson: Gson): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    // Vertically Sliced API Interfaces
    
    @Provides @Singleton fun provideAuthApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)
    @Provides @Singleton fun provideProfileApi(retrofit: Retrofit): ProfileApi = retrofit.create(ProfileApi::class.java)
    @Provides @Singleton fun provideDashboardApi(retrofit: Retrofit): DashboardApi = retrofit.create(DashboardApi::class.java)
    @Provides @Singleton fun provideTutorApi(retrofit: Retrofit): TutorApi = retrofit.create(TutorApi::class.java)
    @Provides @Singleton fun provideSessionApi(retrofit: Retrofit): SessionApi = retrofit.create(SessionApi::class.java)
    @Provides @Singleton fun provideResourceApi(retrofit: Retrofit): ResourceApi = retrofit.create(ResourceApi::class.java)
    @Provides @Singleton fun provideAdminApi(retrofit: Retrofit): AdminApi = retrofit.create(AdminApi::class.java)
    @Provides @Singleton fun provideGamificationApi(retrofit: Retrofit): GamificationApi = retrofit.create(GamificationApi::class.java)
    @Provides @Singleton fun provideQuizApi(retrofit: Retrofit): QuizApi = retrofit.create(QuizApi::class.java)
    @Provides @Singleton fun provideNotificationApi(retrofit: Retrofit): NotificationApi = retrofit.create(NotificationApi::class.java)
    @Provides @Singleton fun provideVotingApi(retrofit: Retrofit): VotingApi = retrofit.create(VotingApi::class.java)
    @Provides @Singleton fun provideMessagingApi(retrofit: Retrofit): MessagingApi = retrofit.create(MessagingApi::class.java)
}

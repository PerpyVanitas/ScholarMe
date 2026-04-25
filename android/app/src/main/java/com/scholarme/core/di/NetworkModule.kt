package com.scholarme.core.di

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.scholarme.BuildConfig
import com.scholarme.core.auth.SessionValidator
import com.scholarme.core.config.AppConfig
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.data.remote.AuthInterceptor
import com.scholarme.core.data.remote.NetworkErrorInterceptor
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

/**
 * Hilt Dependency Injection Module for Network Layer
 * 
 * Provides singleton instances of:
 * - Gson: JSON serialization with ISO 8601 date format
 * - TokenManager: Secure token storage
 * - SessionValidator: Session state validation
 * - OkHttpClient: HTTP client with auth, logging, and error interceptors
 * - Retrofit: Type-safe REST client configured for the backend API
 * - ApiService: Interface implementation for all API endpoints
 * 
 * All dependencies are scoped to SingletonComponent (application lifecycle).
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    /** Gson configured for ISO 8601 date parsing (UTC format from backend) */
    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    /** Provides singleton TokenManager for secure credential storage */
    @Provides
    @Singleton
    fun provideTokenManager(@ApplicationContext context: Context): TokenManager {
        return TokenManager.getInstance(context)
    }

    /** Provides session validator for authentication checks */
    @Provides
    @Singleton
    fun provideSessionValidator(tokenManager: TokenManager): SessionValidator {
        return SessionValidator(tokenManager)
    }

    /** Interceptor that attaches Bearer token to authenticated requests */
    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenManager: TokenManager): AuthInterceptor {
        return AuthInterceptor(tokenManager)
    }
    
    /** Interceptor with retry logic and user-friendly error messages */
    @Provides
    @Singleton
    fun provideNetworkErrorInterceptor(): NetworkErrorInterceptor {
        return NetworkErrorInterceptor()
    }

    /**
     * Configures OkHttpClient with:
     * - Auth interceptor (adds JWT to headers)
     * - Network error interceptor (retry logic)
     * - Logging interceptor (debug builds only)
     * - Configurable timeouts from AppConfig
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        networkErrorInterceptor: NetworkErrorInterceptor
    ): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (AppConfig.enableNetworkLogging) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(networkErrorInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(AppConfig.CONNECT_TIMEOUT, TimeUnit.SECONDS)
            .readTimeout(AppConfig.READ_TIMEOUT, TimeUnit.SECONDS)
            .writeTimeout(AppConfig.WRITE_TIMEOUT, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    /** Retrofit instance configured with base URL from AppConfig (build flavor specific) */
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(AppConfig.apiBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    /** Retrofit ApiService interface implementation for all API endpoints */
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
    fun provideRetrofit(okHttpClient: OkHttpClient, gson: Gson): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    /** Creates type-safe API interface implementation */
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

package com.scholarme.core.data.remote

import com.scholarme.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton API Client using Retrofit.
 * Points to the Next.js API routes on Vercel under /api/android/.
 * 
 * Note: For authenticated requests, use the Hilt-injected ApiService (via NetworkModule)
 * which includes the AuthInterceptor. This singleton is kept for legacy non-Hilt usage.
 */
object ApiClient {

    /**
     * Base URL for all Android API requests.
     * Uses BuildConfig.API_BASE_URL which should be set to:
     *   Production: "https://scholarme.vercel.app/api/android/"
     *   Development: "http://10.0.2.2:3000/api/android/"
     */
    private val BASE_URL: String get() = if (BuildConfig.DEBUG)
        "http://10.0.2.2:3000/api/android/"
    else
        "https://scholarme.vercel.app/api/android/"

    private const val TIMEOUT_SECONDS = 30L

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val apiService: ApiService by lazy {
        retrofit.create(ApiService::class.java)
    }
}

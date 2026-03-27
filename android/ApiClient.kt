package com.example.scholarme.api

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.google.gson.GsonBuilder

object ApiClient {
    private const val BASE_URL = "https://your-domain.com/api/android/"
    private const val TOKEN_KEY = "auth_token"
    private const val USER_ID_KEY = "user_id"

    private var apiService: ApiService? = null
    private var securePrefs: SharedPreferences? = null

    fun init(context: Context) {
        // Initialize encrypted SharedPreferences for secure token storage
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        securePrefs = EncryptedSharedPreferences.create(
            context,
            "scholar_me_secure",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun getApiService(): ApiService {
        if (apiService == null) {
            val gson = GsonBuilder()
                .setDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
                .create()

            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(AuthInterceptor())
                .addInterceptor(ErrorInterceptor())
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()

            apiService = retrofit.create(ApiService::class.java)
        }
        return apiService!!
    }

    fun saveToken(token: String, userId: String) {
        securePrefs?.edit()?.apply {
            putString(TOKEN_KEY, token)
            putString(USER_ID_KEY, userId)
            apply()
        }
    }

    fun getToken(): String? {
        return securePrefs?.getString(TOKEN_KEY, null)
    }

    fun getUserId(): String? {
        return securePrefs?.getString(USER_ID_KEY, null)
    }

    fun clearToken() {
        securePrefs?.edit()?.apply {
            remove(TOKEN_KEY)
            remove(USER_ID_KEY)
            apply()
        }
    }

    fun isLoggedIn(): Boolean {
        return getToken() != null
    }

    // Inner class for adding auth token to requests
    private class AuthInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): okhttp3.Response {
            val token = getToken()
            val originalRequest = chain.request()

            val requestBuilder = originalRequest.newBuilder()
            if (token != null && !originalRequest.url.encodedPath.contains("/auth/login") &&
                !originalRequest.url.encodedPath.contains("/auth/register")
            ) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }

            return chain.proceed(requestBuilder.build())
        }
    }

    // Inner class for handling API errors
    private class ErrorInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): okhttp3.Response {
            val response = chain.proceed(chain.request())

            // Handle 401 - Token expired
            if (response.code == 401) {
                clearToken()
                // Trigger logout - notify app to navigate to login
            }

            return response
        }
    }
}

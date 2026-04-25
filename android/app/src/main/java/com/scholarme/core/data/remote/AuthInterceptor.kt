package com.scholarme.core.data.remote

import android.util.Log
import com.scholarme.core.data.local.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * OkHttp Interceptor that handles JWT authentication and token management.
 *
 * Responsibilities:
 * - Add Bearer token to all authenticated requests
 * - Skip auth header for public endpoints (login, register, etc.)
 * - Detect 401 Unauthorized responses
 * - Trigger token refresh on 401 (delegated to NetworkErrorInterceptor)
 */
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip auth for public endpoints
        if (isPublicEndpoint(originalRequest.url.encodedPath)) {
            return chain.proceed(originalRequest)
        }

        // Add Bearer token to request
        val token = tokenManager.getAccessToken()
        return if (!token.isNullOrBlank()) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            
            Log.d(TAG, "Adding Authorization header for: ${originalRequest.url.encodedPath}")
            chain.proceed(authenticatedRequest)
        } else {
            Log.w(TAG, "No token available for authenticated request: ${originalRequest.url.encodedPath}")
            chain.proceed(originalRequest)
        }
    }

    /**
     * Determines if an endpoint requires authentication.
     */
    private fun isPublicEndpoint(path: String): Boolean {
        val publicPaths = listOf(
            "/auth/login",
            "/auth/email-login",
            "/auth/card-login",
            "/auth/register",
            "/auth/refresh",
            "/tutors" // Tutor listing is public
        )
        return publicPaths.any { path.contains(it) }
    }

    companion object {
        private const val TAG = "AuthInterceptor"
    }
}

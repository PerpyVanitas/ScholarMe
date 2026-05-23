package com.scholarme.core.data.remote

import com.scholarme.core.data.local.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * OkHttp Interceptor that attaches JWT Bearer tokens to outgoing API requests.
 *
 * Automatically skips attaching headers to unauthenticated endpoints like login and register.
 * If a `401 Unauthorized` is returned, it clears the local token storage via [TokenManager].
 *
 * @property tokenManager The manager responsible for retrieving and clearing tokens.
 */
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip auth header for login/register endpoints
        val path = originalRequest.url.encodedPath
        if (path.contains("/auth/login") || 
            path.contains("/auth/register") || 
            path.contains("/auth/card-login")) {
            return chain.proceed(originalRequest)
        }

        // Add token if available
        val token = tokenManager.getToken()
        
        val response = if (!token.isNullOrBlank()) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            chain.proceed(originalRequest)
        }

        if (response.code == 401) {
            tokenManager.clearAll()
            // Optional: Broadcast event or trigger logout in repository
        }

        return response
    }
}


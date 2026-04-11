package com.scholarme.core.data.remote

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject

/**
 * OkHttp Interceptor that handles network errors with retry logic.
 * 
 * Features:
 * - Automatic retry for transient network failures
 * - Exponential backoff between retries
 * - Converts HTTP errors to meaningful exceptions
 */
class NetworkErrorInterceptor @Inject constructor() : Interceptor {

    companion object {
        private const val MAX_RETRIES = 3
        private const val INITIAL_BACKOFF_MS = 1000L
        private const val BACKOFF_MULTIPLIER = 2.0
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var lastException: IOException? = null
        var currentBackoff = INITIAL_BACKOFF_MS

        repeat(MAX_RETRIES) { attempt ->
            try {
                val response = chain.proceed(request)
                
                // Handle specific HTTP error codes
                when (response.code) {
                    401 -> {
                        // Token expired or invalid - let the app handle re-authentication
                        return response
                    }
                    403 -> {
                        // Forbidden - user doesn't have permission
                        return response
                    }
                    404 -> {
                        // Not found
                        return response
                    }
                    in 500..599 -> {
                        // Server error - retry if we have attempts left
                        if (attempt < MAX_RETRIES - 1) {
                            response.close()
                            Thread.sleep(currentBackoff)
                            currentBackoff = (currentBackoff * BACKOFF_MULTIPLIER).toLong()
                            return@repeat
                        }
                        return response
                    }
                    else -> {
                        return response
                    }
                }
            } catch (e: SocketTimeoutException) {
                lastException = NetworkException(
                    "Connection timed out. Please check your internet connection and try again.",
                    e
                )
                if (attempt < MAX_RETRIES - 1) {
                    Thread.sleep(currentBackoff)
                    currentBackoff = (currentBackoff * BACKOFF_MULTIPLIER).toLong()
                }
            } catch (e: UnknownHostException) {
                lastException = NetworkException(
                    "Unable to reach the server. Please check your internet connection.",
                    e
                )
                if (attempt < MAX_RETRIES - 1) {
                    Thread.sleep(currentBackoff)
                    currentBackoff = (currentBackoff * BACKOFF_MULTIPLIER).toLong()
                }
            } catch (e: IOException) {
                lastException = NetworkException(
                    "Network error occurred. Please try again.",
                    e
                )
                if (attempt < MAX_RETRIES - 1) {
                    Thread.sleep(currentBackoff)
                    currentBackoff = (currentBackoff * BACKOFF_MULTIPLIER).toLong()
                }
            }
        }

        throw lastException ?: NetworkException("Unknown network error occurred.")
    }
}

/**
 * Custom exception for network-related errors.
 * Provides user-friendly error messages.
 */
class NetworkException(
    override val message: String,
    cause: Throwable? = null
) : IOException(message, cause)

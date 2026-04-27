package com.scholarme.core.error

import android.util.Log
import com.google.gson.Gson
import com.scholarme.core.data.model.ApiError
import com.scholarme.core.network.NetworkResult
import okhttp3.ResponseBody
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Centralized error handler for network operations.
 * Converts various exceptions into standardized NetworkResult errors.
 *
 * Handles:
 * - HTTP errors (4xx, 5xx)
 * - Network errors (connectivity, timeout)
 * - Serialization errors
 * - Unknown/unexpected errors
 */
object ErrorHandler {

    private const val TAG = "ErrorHandler"
    private val gson = Gson()

    /**
     * Converts Throwable to NetworkResult.Error with appropriate message and code.
     *
     * @param throwable The exception that occurred
     * @param apiError Parsed API error response (if available)
     * @return NetworkResult.Error or NetworkResult.Unauthorized
     */
    fun <T> handleException(
        throwable: Throwable,
        apiError: ApiError? = null
    ): NetworkResult<T> {
        Log.e(TAG, "Network operation failed", throwable)

        return when (throwable) {
            is HttpException -> {
                when (throwable.code()) {
                    401 -> NetworkResult.Unauthorized(
                        message = "Authentication failed - please log in again",
                        exception = throwable
                    )
                    403 -> NetworkResult.Error(
                        message = apiError?.message ?: "Access forbidden",
                        code = 403,
                        apiError = apiError,
                        exception = throwable
                    )
                    404 -> NetworkResult.Error(
                        message = apiError?.message ?: "Resource not found",
                        code = 404,
                        apiError = apiError,
                        exception = throwable
                    )
                    in 500..599 -> NetworkResult.Error(
                        message = "Server error - please try again later",
                        code = throwable.code(),
                        apiError = apiError,
                        exception = throwable
                    )
                    else -> NetworkResult.Error(
                        message = apiError?.message ?: "Request failed: HTTP ${throwable.code()}",
                        code = throwable.code(),
                        apiError = apiError,
                        exception = throwable
                    )
                }
            }
            is SocketTimeoutException -> NetworkResult.Error(
                message = "Request timeout - please check your connection",
                exception = throwable
            )
            is UnknownHostException -> NetworkResult.Error(
                message = "Network error - please check your internet connection",
                exception = throwable
            )
            is IOException -> NetworkResult.Error(
                message = "Connection error - please check your internet connection",
                exception = throwable
            )
            else -> NetworkResult.Error(
                message = throwable.message ?: "An unexpected error occurred",
                exception = throwable
            )
        }
    }

    /**
     * Parses error response body into ApiError.
     *
     * @param body The response body to parse
     * @return ApiError if parsing succeeds, null otherwise
     */
    fun parseErrorBody(body: ResponseBody?): ApiError? {
        return try {
            if (body == null) return null
            gson.fromJson(body.string(), ApiError::class.java)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse error response", e)
            null
        }
    }

    /**
     * Gets user-friendly error message from any result.
     */
    fun getUserMessage(result: NetworkResult<*>): String {
        return when (result) {
            is NetworkResult.Error -> result.message
            is NetworkResult.Unauthorized -> result.message
            else -> "Unknown error"
        }
    }

    /**
     * Classifies error severity for logging.
     */
    enum class ErrorSeverity {
        CRITICAL,      // 500+ errors, auth failures
        MAJOR,         // 4xx validation errors
        RECOVERABLE,   // Temporary network issues
        INFORMATIONAL  // Expected errors (404 for optional data)
    }

    /**
     * Determines error severity for appropriate handling.
     */
    fun getErrorSeverity(result: NetworkResult<*>): ErrorSeverity {
        return when (result) {
            is NetworkResult.Unauthorized -> ErrorSeverity.CRITICAL
            is NetworkResult.Error -> when (result.code) {
                in 500..599 -> ErrorSeverity.CRITICAL
                in 400..499 -> ErrorSeverity.MAJOR
                else -> ErrorSeverity.RECOVERABLE
            }
            else -> ErrorSeverity.INFORMATIONAL
        }
    }
}
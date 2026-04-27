package com.scholarme.core.network

import com.scholarme.core.data.model.ApiError

/**
 * Sealed class representing the result of a network operation.
 * Standardizes all API response handling across the application.
 *
 * States:
 * - Loading: Network operation in progress
 * - Success: Operation completed with data
 * - Error: Operation failed with error details
 * - Unauthorized: Authentication token invalid/expired (special error case)
 *
 * Replaces the generic Result<T> for better type safety and explicit error handling.
 */
sealed class NetworkResult<out T> {
    class Loading<T> : NetworkResult<T>() {
        override fun equals(other: Any?): Boolean = other is Loading<*>
        override fun hashCode(): Int = javaClass.hashCode()
    }
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error<T>(
        val message: String,
        val code: Int? = null,
        val apiError: ApiError? = null,
        val exception: Throwable? = null
    ) : NetworkResult<T>()
    data class Unauthorized<T>(
        val message: String = "Unauthorized",
        val exception: Throwable? = null
    ) : NetworkResult<T>()

    // Utility properties
    val isLoading: Boolean get() = this is Loading
    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error || this is Unauthorized

    // Utility methods
    inline fun <R> map(transform: (T) -> R): NetworkResult<R> = when (this) {
        is Loading -> Loading()
        is Success -> Success(transform(data))
        is Error -> Error(message, code, apiError, exception)
        is Unauthorized -> Unauthorized(message, exception)
    }

    inline fun <R> flatMap(transform: (T) -> NetworkResult<R>): NetworkResult<R> = when (this) {
        is Loading -> Loading()
        is Success -> transform(data)
        is Error -> Error(message, code, apiError, exception)
        is Unauthorized -> Unauthorized(message, exception)
    }

    inline fun onSuccess(action: (T) -> Unit): NetworkResult<T> {
        if (this is Success) action(data)
        return this
    }

    inline fun onError(action: (String, Int?, Throwable?) -> Unit): NetworkResult<T> {
        when (this) {
            is Error -> action(message, code, exception)
            is Unauthorized -> action(message, null, exception)
            else -> {}
        }
        return this
    }

    inline fun onLoading(action: () -> Unit): NetworkResult<T> {
        if (this is Loading) action()
        return this
    }

    fun getOrNull(): T? = (this as? Success)?.data
    fun getErrorMessage(): String? = when (this) {
        is Error -> message
        is Unauthorized -> message
        else -> null
    }

    fun requireData(): T = (this as? Success)?.data
        ?: throw IllegalStateException("NetworkResult is not Success")
}

// Type aliases for common states
typealias NetworkResource<T> = NetworkResult<T>

package com.scholarme.core.network

import com.scholarme.core.data.model.ApiError
import com.scholarme.core.error.ErrorHandler
import retrofit2.Response

/**
 * Wraps Retrofit Response and provides safe conversion to NetworkResult.
 *
 * Handles:
 * - Successful responses (2xx)
 * - Client errors (4xx)
 * - Server errors (5xx)
 * - Parsing errors
 *
 * Usage:
 * ```
 * val response = apiService.login(request)
 * return response.toNetworkResult()
 * ```
 */

fun <T> Response<T>.toNetworkResult(): NetworkResult<T> {
    return try {
        if (isSuccessful) {
            val body = body()
            if (body != null) {
                NetworkResult.Success(body)
            } else {
                NetworkResult.Error("Empty response body")
            }
        } else {
            val errorBody = errorBody()
            val apiError = ErrorHandler.parseErrorBody(errorBody)
            
            when (code()) {
                401 -> NetworkResult.Unauthorized(
                    message = apiError?.message ?: "Unauthorized",
                    exception = null
                )
                else -> NetworkResult.Error(
                    message = apiError?.message ?: "HTTP ${code()}: ${message()}",
                    code = code(),
                    apiError = apiError
                )
            }
        }
    } catch (e: Exception) {
        ErrorHandler.handleException(e)
    }
}

/**
 * Wraps API response with data extraction and error parsing.
 *
 * For ApiResponse<T> wrapper responses:
 * ```
 * val response = apiService.login(request)
 * return response.toNetworkResultWithData { it.data }
 * ```
 */
fun <ApiT, T> Response<ApiT>.toNetworkResultWithData(
    dataExtractor: (ApiT) -> T?
): NetworkResult<T> {
    return try {
        if (isSuccessful) {
            val body = body()
            if (body != null) {
                val data = dataExtractor(body)
                if (data != null) {
                    NetworkResult.Success(data)
                } else {
                    NetworkResult.Error("No data in response")
                }
            } else {
                NetworkResult.Error("Empty response body")
            }
        } else {
            val errorBody = errorBody()
            val apiError = ErrorHandler.parseErrorBody(errorBody)
            
            when (code()) {
                401 -> NetworkResult.Unauthorized(
                    message = apiError?.message ?: "Unauthorized",
                    exception = null
                )
                else -> NetworkResult.Error(
                    message = apiError?.message ?: "HTTP ${code()}: ${message()}",
                    code = code(),
                    apiError = apiError
                )
            }
        }
    } catch (e: Exception) {
        ErrorHandler.handleException(e)
    }
}
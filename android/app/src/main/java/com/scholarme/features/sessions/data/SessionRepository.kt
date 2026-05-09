package com.scholarme.features.sessions.data

import com.scholarme.features.sessions.data.model.*
import com.scholarme.features.sessions.data.remote.SessionApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class SessionRepository @Inject constructor(
    private val sessionApi: SessionApi
) {
    suspend fun getSessions(
        page: Int = 1,
        limit: Int = 20,
        status: String? = null
    ): Result<SessionListResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = sessionApi.getSessions(page, limit, status)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to fetch sessions")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun createSession(request: CreateSessionRequest): Result<SessionDto> {
        return withContext(Dispatchers.IO) {
            try {
                val response = sessionApi.createSession(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to create session")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun updateSessionStatus(sessionId: String, status: String): Result<SessionDto> {
        return withContext(Dispatchers.IO) {
            try {
                val response = sessionApi.updateSessionStatus(sessionId, UpdateSessionStatusRequest(status))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to update status")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun rateSession(sessionId: String, rating: Int, feedback: String?): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = sessionApi.rateSession(sessionId, RateSessionRequest(rating, feedback))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to submit rating")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

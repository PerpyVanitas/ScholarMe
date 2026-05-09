package com.scholarme.features.admin.data

import com.scholarme.features.admin.data.model.*
import com.scholarme.features.admin.data.remote.AdminApi
import com.scholarme.features.auth.data.model.AuthCard
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for administrative data operations.
 */
class AdminRepository @Inject constructor(
    private val adminApi: AdminApi
) {
    
    suspend fun getAnalytics(): Result<AdminAnalytics> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.getAdminAnalytics()
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        Result.Success(data)
                    } else {
                        Result.Error("Empty analytics data")
                    }
                } else {
                    Result.Error(response.body()?.error?.message ?: "Failed to fetch analytics")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getUsers(): Result<List<UserProfile>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.getUsers()
                if (response.isSuccessful) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch users")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getTimesheets(): Result<List<AdminTimesheet>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.getAdminTimesheets()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch timesheets")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun updateTimesheetStatus(id: String, status: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.approveTimesheet(id, mapOf("status" to status))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to update timesheet")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getAuditLogs(userId: String): Result<List<AuditLogEntry>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.getUserAuditLogs(userId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch audit logs")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getCards(): Result<List<AuthCard>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.getAdminCards()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch cards")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

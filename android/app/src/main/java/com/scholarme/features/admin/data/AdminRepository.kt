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

    suspend fun issueCard(userId: String, cardId: String, pin: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val request = mapOf(
                    "userId" to userId,
                    "cardId" to cardId,
                    "pin" to pin
                )
                val response = adminApi.issueCard(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to issue card")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun revokeCard(cardId: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.revokeCard(cardId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to revoke card")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun createUser(email: String, pass: String, name: String, role: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.createUser(mapOf("email" to email, "password" to pass, "full_name" to name, "role_name" to role))
                if (response.isSuccessful && response.body()?.success == true) Result.Success(Unit)
                else Result.Error("Failed to create user")
            } catch (e: Exception) { Result.Error(e.message ?: "Network error") }
        }
    }

    suspend fun editUser(userId: String, name: String?, email: String?, role: String?, pass: String?): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val map = mutableMapOf("user_id" to userId)
                name?.let { map["full_name"] = it }
                email?.let { map["email"] = it }
                role?.let { map["role_name"] = it }
                if (!pass.isNullOrBlank()) map["password"] = pass
                
                val response = adminApi.editUser(map)
                if (response.isSuccessful && response.body()?.success == true) Result.Success(Unit)
                else Result.Error("Failed to edit user")
            } catch (e: Exception) { Result.Error(e.message ?: "Network error") }
        }
    }

    suspend fun deleteUser(userId: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.deleteUser(mapOf("user_id" to userId))
                if (response.isSuccessful && response.body()?.success == true) Result.Success(Unit)
                else Result.Error("Failed to delete user")
            } catch (e: Exception) { Result.Error(e.message ?: "Network error") }
        }
    }

    suspend fun toggleCardStatus(userId: String, isIssued: Boolean): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = adminApi.issueCard(mapOf("user_id" to userId, "is_card_issued" to isIssued.toString()))
                if (response.isSuccessful && response.body()?.success == true) Result.Success(Unit)
                else Result.Error("Failed to toggle card status")
            } catch (e: Exception) { Result.Error(e.message ?: "Network error") }
        }
    }
}

package com.scholarme.features.profile.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.ChangePasswordRequest
import com.scholarme.core.data.model.UpdateProfileRequest
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for profile operations.
 * Handles profile viewing, updating, and password changes.
 */
class ProfileRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    
    // Legacy constructor for non-Hilt usage
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)
    
    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }
    
    suspend fun getProfile(): Result<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext Result.Error("Not authenticated")
                
                val response = apiService.getProfile(token)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val profile = response.body()?.data
                    if (profile != null) {
                        // Update local storage with latest info
                        tokenManager.saveUserInfo(
                            userId = profile.id,
                            email = profile.email,
                            fullName = profile.fullName,
                            role = profile.role
                        )
                        Result.Success(profile)
                    } else {
                        Result.Error("Failed to load profile")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Failed to load profile"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
    
    suspend fun updateProfile(
        fullName: String?,
        phone: String?,
        bio: String?,
        degreeProgram: String? = null,
        yearLevel: Int? = null
    ): Result<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext Result.Error("Not authenticated")
                
                val request = UpdateProfileRequest(
                    fullName = fullName,
                    phone = phone,
                    bio = bio,
                    degreeProgram = degreeProgram,
                    yearLevel = yearLevel
                )
                
                val response = apiService.updateProfile(token, request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val profile = response.body()?.data
                    if (profile != null) {
                        // Update local storage
                        tokenManager.saveUserInfo(
                            userId = profile.id,
                            email = profile.email,
                            fullName = profile.fullName,
                            role = profile.role
                        )
                        Result.Success(profile)
                    } else {
                        Result.Error("Profile updated but response was empty")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Failed to update profile"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
    
    suspend fun changePassword(
        currentPassword: String,
        newPassword: String
    ): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext Result.Error("Not authenticated")
                
                val request = ChangePasswordRequest(currentPassword, newPassword)
                val response = apiService.changePassword(token, request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Failed to change password"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

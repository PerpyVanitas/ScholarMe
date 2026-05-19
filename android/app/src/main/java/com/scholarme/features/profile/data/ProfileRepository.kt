package com.scholarme.features.profile.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.profile.data.model.*
import com.scholarme.features.profile.data.remote.ProfileApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for profile operations.
 */
class ProfileRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val profileApi: ProfileApi
) {
    
    suspend fun getProfile(): Result<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                if (!tokenManager.isLoggedIn()) return@withContext Result.Error("Not authenticated")
                
                val response = profileApi.getProfile()
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val profile = response.body()?.data
                    if (profile != null) {
                        tokenManager.saveUserInfo(
                            userId = profile.id ?: "",
                            email = profile.email ?: "",
                            fullName = profile.fullName ?: "",
                            role = profile.role ?: "learner"
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
        yearLevel: Int? = null,
        hourlyRate: Double? = null,
        yearsExperience: Int? = null
    ): Result<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                if (!tokenManager.isLoggedIn()) return@withContext Result.Error("Not authenticated")
                
                val request = UpdateProfileRequest(
                    fullName = fullName,
                    phone = phone,
                    bio = bio,
                    degreeProgram = degreeProgram,
                    yearLevel = yearLevel,
                    hourlyRate = hourlyRate,
                    yearsExperience = yearsExperience
                )
                
                val response = profileApi.updateProfile(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val profile = response.body()?.data
                    if (profile != null) {
                        tokenManager.saveUserInfo(
                            userId = profile.id ?: "",
                            email = profile.email ?: "",
                            fullName = profile.fullName ?: "",
                            role = profile.role ?: "learner"
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
                if (!tokenManager.isLoggedIn()) return@withContext Result.Error("Not authenticated")
                
                val request = ChangePasswordRequest(currentPassword, newPassword)
                val response = profileApi.changePassword(request)
                
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

    suspend fun uploadAvatar(filePart: okhttp3.MultipartBody.Part): Result<String> {
        return withContext(Dispatchers.IO) {
            try {
                if (!tokenManager.isLoggedIn()) return@withContext Result.Error("Not authenticated")
                
                val response = profileApi.uploadAvatar(filePart)
                if (response.isSuccessful && response.body()?.success == true) {
                    val pathname = response.body()?.data?.get("avatarUrl") ?: ""
                    Result.Success(pathname)
                } else {
                    Result.Error(response.body()?.error?.message ?: "Upload failed")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

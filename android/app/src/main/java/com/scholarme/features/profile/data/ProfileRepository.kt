package com.scholarme.features.profile.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.ChangePasswordRequest
import com.scholarme.core.data.model.UpdateProfileRequest
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.network.toNetworkResultWithData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for profile operations (Vertical Slice — Profile Feature).
 *
 * Migrated from core.util.Result → core.network.NetworkResult for consistency.
 * Removed ApiClient fallback — injection is exclusively via Hilt.
 */
class ProfileRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getProfile(): NetworkResult<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                val result = apiService.getProfile()
                    .toNetworkResultWithData { it.data }

                // On success, sync local cache
                if (result is NetworkResult.Success) {
                    val profile = result.data
                    tokenManager.saveUserInfo(
                        userId = profile.id,
                        email = profile.email,
                        fullName = profile.fullName,
                        role = profile.role
                    )
                }
                result
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred", exception = e)
            }
        }
    }

    suspend fun updateProfile(
        fullName: String?,
        phone: String?,
        bio: String?,
        degreeProgram: String? = null,
        yearLevel: Int? = null
    ): NetworkResult<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                val request = UpdateProfileRequest(
                    fullName = fullName,
                    phone = phone,
                    bio = bio,
                    degreeProgram = degreeProgram,
                    yearLevel = yearLevel
                )

                val result = apiService.updateProfile(request)
                    .toNetworkResultWithData { it.data }

                // On success, sync local cache
                if (result is NetworkResult.Success) {
                    val profile = result.data
                    tokenManager.saveUserInfo(
                        userId = profile.id,
                        email = profile.email,
                        fullName = profile.fullName,
                        role = profile.role
                    )
                }
                result
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred", exception = e)
            }
        }
    }

    suspend fun changePassword(
        currentPassword: String,
        newPassword: String
    ): NetworkResult<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val request = ChangePasswordRequest(currentPassword, newPassword)
                apiService.changePassword(request)
                    .toNetworkResultWithData { Unit }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred", exception = e)
            }
        }
    }
}

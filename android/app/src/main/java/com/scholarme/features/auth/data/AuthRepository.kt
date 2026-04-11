package com.scholarme.features.auth.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.*
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for authentication operations.
 * Handles login, registration, and token management.
 */
class AuthRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    
    // Legacy constructor for non-Hilt usage
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)
    
    suspend fun login(email: String, password: String): Result<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.login(LoginRequest(email, password))
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        // Save token and user info
                        tokenManager.saveAccessToken(data.token)
                        tokenManager.saveUserInfo(
                            userId = data.user.id,
                            email = data.user.email,
                            fullName = data.user.fullName,
                            role = data.user.role
                        )
                        Result.Success(data.user)
                    } else {
                        Result.Error("Invalid response from server")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Login failed"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
    
    suspend fun register(
        email: String,
        password: String,
        fullName: String,
        role: String = "learner"
    ): Result<String> {
        return withContext(Dispatchers.IO) {
            try {
                val request = RegisterRequest(email, password, fullName, role)
                val response = apiService.register(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        // Save token and user info after registration
                        tokenManager.saveAccessToken(data.token)
                        tokenManager.saveUserInfo(
                            userId = data.user.id,
                            email = data.user.email,
                            fullName = data.user.fullName,
                            role = data.user.role
                        )
                        Result.Success(data.user.id)
                    } else {
                        Result.Error("Registration successful but no user data returned")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Registration failed"
                    Result.Error(errorMsg)
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
    
    fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()
    
    fun logout() {
        tokenManager.clearAll()
    }
    
    fun getAccessToken(): String? = tokenManager.getAccessToken()
    
    fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }
}

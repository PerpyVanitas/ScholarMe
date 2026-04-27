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
 * Authentication Repository (Auth Feature - Data Layer)
 * 
 * Provides data operations for user authentication:
 * - Email/password login with automatic token persistence
 * - User registration with profile creation
 * - Session state management via TokenManager
 * 
 * Uses Hilt dependency injection with fallback constructor for ViewModelFactory usage.
 * All network operations run on IO dispatcher for non-blocking execution.
 * 
 * @property tokenManager Handles secure storage of JWT tokens and user info
 * @property apiService Retrofit interface for backend API calls
 */
class AuthRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    
    /** Secondary constructor for non-Hilt contexts (e.g., ViewModelFactory) */
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)
    
    /**
     * Authenticates user with email credentials.
     * On success, persists JWT token and user profile to secure storage.
     * 
     * @param email User's email address
     * @param password User's password
     * @return Result.Success with UserProfile or Result.Error with message
     */
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
    
    /**
     * Registers a new user account.
     * On success, automatically logs in the user by persisting credentials.
     * 
     * @param email New user's email address (must be unique)
     * @param password Account password
     * @param fullName User's display name
     * @param role User role: "learner" (default) or "tutor"
     * @return Result.Success with user ID or Result.Error with message
     */
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
    
    /** Checks if user has a valid stored session */
    fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()
    
    /** Clears all stored credentials and ends the user session */
    fun logout() {
        tokenManager.clearAll()
    }
    
    /** Returns raw JWT token or null if not authenticated */
    fun getAccessToken(): String? = tokenManager.getAccessToken()
    
    /** Returns formatted Bearer token for Authorization header */
    fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }
}

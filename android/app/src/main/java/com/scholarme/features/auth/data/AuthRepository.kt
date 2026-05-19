package com.scholarme.features.auth.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.auth.data.model.*
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.features.auth.data.remote.AuthApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Authentication Repository (Auth Feature - Data Layer)
 */
class AuthRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val authApi: AuthApi
) {
    
    suspend fun login(email: String, password: String): Result<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                val response = authApi.login(EmailLoginRequest(email, password))
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        val user = UserProfile(
                            id = data.user?.id ?: data.userId ?: "",
                            email = data.user?.email ?: data.email ?: "",
                            fullName = data.user?.fullName ?: data.profile?.fullName ?: "",
                            role = data.user?.role ?: data.profile?.role ?: "learner"
                        )
                        
                        tokenManager.saveAccessToken(data.token)
                        tokenManager.saveUserInfo(
                            userId = user.id ?: "",
                            email = user.email ?: "",
                            fullName = user.fullName ?: "",
                            role = user.role ?: "learner"
                        )
                        Result.Success(user)
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
                val response = authApi.register(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        val token = data.token ?: data.sessionToken ?: ""
                        val user = data.user ?: UserProfile(id = "", email = email, fullName = fullName, role = role)

                        tokenManager.saveAccessToken(token)
                        tokenManager.saveUserInfo(
                            userId = user.id ?: "",
                            email = user.email ?: "",
                            fullName = user.fullName ?: "",
                            role = user.role ?: "learner"
                        )
                        Result.Success(user.id ?: "")

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
}

package com.example.scholarme.repository

import com.example.scholarme.api.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class AuthRepository(private val apiService: ApiService) {

    fun register(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        phoneNumber: String,
        accountType: String = "learner"
    ): Flow<Result<AuthResponse>> = flow {
        try {
            val request = RegisterRequest(
                firstName = firstName,
                lastName = lastName,
                email = email,
                password = password,
                phoneNumber = phoneNumber,
                accountType = accountType
            )
            val response = apiService.register(request)
            if (response.isSuccessful && response.body() != null) {
                emit(Result.success(response.body()!!))
            } else {
                emit(Result.failure(Exception(response.message())))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    fun login(email: String, password: String): Flow<Result<LoginResponse>> = flow {
        try {
            val request = LoginRequest(email = email, password = password)
            val response = apiService.login(request)
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                if (loginResponse.success && loginResponse.data != null) {
                    // Save token
                    ApiClient.saveToken(loginResponse.data.session, loginResponse.data.userId)
                }
                emit(Result.success(loginResponse))
            } else {
                emit(Result.failure(Exception(response.message())))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    fun getProfile(): Flow<Result<ProfileResponse>> = flow {
        try {
            val response = apiService.getProfile()
            if (response.isSuccessful && response.body() != null) {
                emit(Result.success(response.body()!!))
            } else {
                emit(Result.failure(Exception(response.message())))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    fun updateProfile(
        firstName: String,
        lastName: String,
        phoneNumber: String? = null,
        birthdate: String? = null,
        bio: String? = null
    ): Flow<Result<UpdateProfileResponse>> = flow {
        try {
            val request = UpdateProfileRequest(
                firstName = firstName,
                lastName = lastName,
                phoneNumber = phoneNumber,
                birthdate = birthdate,
                bio = bio
            )
            val response = apiService.updateProfile(request)
            if (response.isSuccessful && response.body() != null) {
                emit(Result.success(response.body()!!))
            } else {
                emit(Result.failure(Exception(response.message())))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    fun changePassword(oldPassword: String, newPassword: String): Flow<Result<String>> = flow {
        try {
            val request = ChangePasswordRequest(
                oldPassword = oldPassword,
                newPassword = newPassword
            )
            val response = apiService.changePassword(request)
            if (response.isSuccessful) {
                emit(Result.success("Password changed successfully"))
            } else {
                emit(Result.failure(Exception(response.message())))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    fun logout() {
        ApiClient.clearToken()
    }

    fun isLoggedIn(): Boolean {
        return ApiClient.isLoggedIn()
    }
}

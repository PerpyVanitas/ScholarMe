package com.example.scholarme.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.scholarme.api.LoginData
import com.example.scholarme.api.UserProfile
import com.example.scholarme.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val message: String) : AuthState()
    data class Error(val message: String, val errorCode: String? = null) : AuthState()
    data class LoginSuccess(val data: LoginData) : AuthState()
    data class ProfileLoaded(val profile: UserProfile) : AuthState()
}

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn

    init {
        checkLoginStatus()
    }

    private fun checkLoginStatus() {
        _isLoggedIn.value = repository.isLoggedIn()
    }

    fun register(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        phoneNumber: String,
        accountType: String = "learner"
    ) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            repository.register(firstName, lastName, email, password, phoneNumber, accountType)
                .collect { result ->
                    result.onSuccess { response ->
                        if (response.success) {
                            _authState.value = AuthState.Success("Registration successful. Please check your email to verify your account.")
                        } else {
                            _authState.value = AuthState.Error(response.message, response.errorCode)
                        }
                    }
                    result.onFailure { exception ->
                        _authState.value = AuthState.Error(exception.message ?: "Registration failed")
                    }
                }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            repository.login(email, password)
                .collect { result ->
                    result.onSuccess { response ->
                        if (response.success && response.data != null) {
                            _authState.value = AuthState.LoginSuccess(response.data)
                            _isLoggedIn.value = true
                        } else {
                            _authState.value = AuthState.Error(response.message, response.errorCode)
                        }
                    }
                    result.onFailure { exception ->
                        _authState.value = AuthState.Error(exception.message ?: "Login failed")
                    }
                }
        }
    }

    fun getProfile() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            repository.getProfile()
                .collect { result ->
                    result.onSuccess { response ->
                        if (response.success && response.data != null) {
                            _authState.value = AuthState.ProfileLoaded(response.data)
                        } else {
                            _authState.value = AuthState.Error("Failed to load profile")
                        }
                    }
                    result.onFailure { exception ->
                        _authState.value = AuthState.Error(exception.message ?: "Failed to load profile")
                    }
                }
        }
    }

    fun updateProfile(
        firstName: String,
        lastName: String,
        phoneNumber: String? = null,
        birthdate: String? = null,
        bio: String? = null
    ) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            repository.updateProfile(firstName, lastName, phoneNumber, birthdate, bio)
                .collect { result ->
                    result.onSuccess { response ->
                        if (response.success) {
                            _authState.value = AuthState.Success("Profile updated successfully")
                        } else {
                            _authState.value = AuthState.Error(response.message)
                        }
                    }
                    result.onFailure { exception ->
                        _authState.value = AuthState.Error(exception.message ?: "Failed to update profile")
                    }
                }
        }
    }

    fun changePassword(oldPassword: String, newPassword: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            repository.changePassword(oldPassword, newPassword)
                .collect { result ->
                    result.onSuccess { message ->
                        _authState.value = AuthState.Success(message)
                    }
                    result.onFailure { exception ->
                        _authState.value = AuthState.Error(exception.message ?: "Failed to change password")
                    }
                }
        }
    }

    fun logout() {
        repository.logout()
        _isLoggedIn.value = false
        _authState.value = AuthState.Idle
    }
}

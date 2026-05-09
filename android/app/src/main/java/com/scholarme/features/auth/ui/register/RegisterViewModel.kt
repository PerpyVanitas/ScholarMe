package com.scholarme.features.auth.ui.register

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _registerState = MutableStateFlow<Result<String>?>(null)
    val registerState: StateFlow<Result<String>?> = _registerState.asStateFlow()
    
    private val _fullNameError = MutableStateFlow<String?>(null)
    val fullNameError: StateFlow<String?> = _fullNameError.asStateFlow()
    
    private val _emailError = MutableStateFlow<String?>(null)
    val emailError: StateFlow<String?> = _emailError.asStateFlow()
    
    private val _passwordError = MutableStateFlow<String?>(null)
    val passwordError: StateFlow<String?> = _passwordError.asStateFlow()
    
    private val _confirmPasswordError = MutableStateFlow<String?>(null)
    val confirmPasswordError: StateFlow<String?> = _confirmPasswordError.asStateFlow()
    
    fun register(
        fullName: String,
        email: String,
        password: String,
        confirmPassword: String,
        role: String = "learner"
    ) {
        var hasError = false
        
        if (fullName.isBlank()) {
            _fullNameError.value = "Full name is required"
            hasError = true
        } else {
            _fullNameError.value = null
        }
        
        if (email.isBlank()) {
            _emailError.value = "Email is required"
            hasError = true
        } else {
            _emailError.value = null
        }
        
        if (password.isBlank()) {
            _passwordError.value = "Password is required"
            hasError = true
        } else {
            _passwordError.value = null
        }
        
        if (confirmPassword != password) {
            _confirmPasswordError.value = "Passwords do not match"
            hasError = true
        } else {
            _confirmPasswordError.value = null
        }
        
        if (hasError) return
        
        _registerState.value = Result.Loading
        
        viewModelScope.launch {
            val result = authRepository.register(email, password, fullName, role)
            _registerState.value = result
        }
    }
    
    fun clearState() {
        _registerState.value = null
        _fullNameError.value = null
        _emailError.value = null
        _passwordError.value = null
        _confirmPasswordError.value = null
    }
}

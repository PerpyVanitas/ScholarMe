package com.scholarme.features.auth.ui.register

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the Register screen.
 */
@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _registerState = MutableLiveData<Result<String>?>()
    val registerState: LiveData<Result<String>?> = _registerState
    
    private val _fullNameError = MutableLiveData<String?>()
    val fullNameError: LiveData<String?> = _fullNameError
    
    private val _emailError = MutableLiveData<String?>()
    val emailError: LiveData<String?> = _emailError
    
    private val _passwordError = MutableLiveData<String?>()
    val passwordError: LiveData<String?> = _passwordError
    
    private val _confirmPasswordError = MutableLiveData<String?>()
    val confirmPasswordError: LiveData<String?> = _confirmPasswordError
    
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

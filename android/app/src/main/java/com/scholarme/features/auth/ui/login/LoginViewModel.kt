package com.scholarme.features.auth.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.util.Result
import com.scholarme.features.auth.data.AuthRepository
import kotlinx.coroutines.launch

/**
 * ViewModel for the Login screen.
 * Handles login form state and authentication logic.
 */
class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {
    
    private val _loginState = MutableLiveData<Result<UserProfile>?>()
    val loginState: LiveData<Result<UserProfile>?> = _loginState
    
    private val _emailError = MutableLiveData<String?>()
    val emailError: LiveData<String?> = _emailError
    
    private val _passwordError = MutableLiveData<String?>()
    val passwordError: LiveData<String?> = _passwordError
    
    fun login(email: String, password: String) {
        // Validate inputs
        var hasError = false
        
        if (email.isBlank()) {
            _emailError.value = "Email is required"
            hasError = true
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _emailError.value = "Invalid email format"
            hasError = true
        } else {
            _emailError.value = null
        }
        
        if (password.isBlank()) {
            _passwordError.value = "Password is required"
            hasError = true
        } else if (password.length < 6) {
            _passwordError.value = "Password must be at least 6 characters"
            hasError = true
        } else {
            _passwordError.value = null
        }
        
        if (hasError) return
        
        // Perform login
        _loginState.value = Result.Loading
        
        viewModelScope.launch {
            val result = authRepository.login(email, password)
            _loginState.value = result
        }
    }
    
    fun clearState() {
        _loginState.value = null
        _emailError.value = null
        _passwordError.value = null
    }
}

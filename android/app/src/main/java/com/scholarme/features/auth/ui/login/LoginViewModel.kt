package com.scholarme.features.auth.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.core.util.Result
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the Login screen.
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _loginState = MutableLiveData<Result<UserProfile>?>()
    val loginState: LiveData<Result<UserProfile>?> = _loginState
    
    private val _emailError = MutableLiveData<String?>()
    val emailError: LiveData<String?> = _emailError
    
    private val _passwordError = MutableLiveData<String?>()
    val passwordError: LiveData<String?> = _passwordError
    
    fun login(email: String, password: String) {
        var hasError = false
        
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
        
        if (hasError) return
        
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

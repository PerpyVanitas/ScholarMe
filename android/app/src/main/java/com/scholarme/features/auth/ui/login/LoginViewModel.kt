package com.scholarme.features.auth.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.core.util.Result
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _loginState = MutableStateFlow<Result<UserProfile>?>(null)
    val loginState: StateFlow<Result<UserProfile>?> = _loginState.asStateFlow()
    
    private val _emailError = MutableStateFlow<String?>(null)
    val emailError: StateFlow<String?> = _emailError.asStateFlow()
    
    private val _passwordError = MutableStateFlow<String?>(null)
    val passwordError: StateFlow<String?> = _passwordError.asStateFlow()
    
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

    fun loginWithCardMock(cardId: String, pin: String) {
        _loginState.value = Result.Loading
        viewModelScope.launch {
            // Mock a successful login after a short delay
            kotlinx.coroutines.delay(1500)
            val mockUser = UserProfile(
                id = cardId,
                email = "student@cit.edu",
                fullName = "Member Student",
                role = "learner"
            )
            _loginState.value = Result.Success(mockUser)
        }
    }
}

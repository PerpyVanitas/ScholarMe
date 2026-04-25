package com.scholarme.features.auth.ui.login

import android.util.Patterns
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for Login screen (Auth Feature - Presentation Layer).
 *
 * Manages:
 * - Login form state (email, password)
 * - Form validation (email format, password strength)
 * - Login operation and state transitions
 * - Error messages per field or global
 * - Navigator events (navigate to dashboard on success)
 *
 * Uses StateFlow for Compose/reactive UI readiness.
 * BaseViewModel provides standard error/loading/navigation handling.
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : BaseViewModel<LoginScreenState>() {

    private val _formState = MutableStateFlow(LoginFormState())
    val formState: StateFlow<LoginFormState> = _formState.asStateFlow()

    private val _loginInProgress = MutableStateFlow(false)
    val loginInProgress: StateFlow<Boolean> = _loginInProgress.asStateFlow()

    override fun createInitialState() = LoginScreenState(
        isSuccess = false,
        user = null
    )

    // =====================================================================
    // Form Input Management
    // =====================================================================

    fun updateEmail(email: String) {
        _formState.update { it.copy(email = email, emailError = null) }
    }

    fun updatePassword(password: String) {
        _formState.update { it.copy(password = password, passwordError = null) }
    }

    fun updateCardId(cardId: String) {
        _formState.update { it.copy(cardId = cardId, cardIdError = null) }
    }

    fun updatePin(pin: String) {
        _formState.update { it.copy(pin = pin, pinError = null) }
    }

    fun toggleLoginMode() {
        _formState.update { it.copy(isCardMode = !it.isCardMode) }
    }

    // =====================================================================
    // Email/Password Login
    // =====================================================================

    fun loginWithEmail() {
        val currentForm = _formState.value
        
        // Validate form
        if (!validateEmailLoginForm(currentForm)) {
            return
        }

        performEmailLogin(currentForm.email, currentForm.password)
    }

    private fun validateEmailLoginForm(form: LoginFormState): Boolean {
        var isValid = true
        val updates = mutableMapOf<String, String?>()

        // Email validation
        if (form.email.isBlank()) {
            updates["emailError"] = "Email is required"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(form.email).matches()) {
            updates["emailError"] = "Invalid email format"
            isValid = false
        }

        // Password validation
        if (form.password.isBlank()) {
            updates["passwordError"] = "Password is required"
            isValid = false
        } else if (form.password.length < 6) {
            updates["passwordError"] = "Password must be at least 6 characters"
            isValid = false
        }

        // Apply validation errors
        if (updates.isNotEmpty()) {
            _formState.update {
                var updated = it
                updates.forEach { (field, error) ->
                    updated = when (field) {
                        "emailError" -> updated.copy(emailError = error)
                        "passwordError" -> updated.copy(passwordError = error)
                        else -> updated
                    }
                }
                updated
            }
        }

        return isValid
    }

    private fun performEmailLogin(email: String, password: String) {
        _loginInProgress.value = true
        setLoading(true)

        viewModelScope.launch {
            val result = authRepository.loginWithEmail(email, password)
            handleLoginResult(result)
        }
    }

    // =====================================================================
    // Card-Based Login
    // =====================================================================

    fun loginWithCard() {
        val currentForm = _formState.value

        // Validate form
        if (!validateCardLoginForm(currentForm)) {
            return
        }

        performCardLogin(currentForm.cardId, currentForm.pin)
    }

    private fun validateCardLoginForm(form: LoginFormState): Boolean {
        var isValid = true
        val updates = mutableMapOf<String, String?>()

        if (form.cardId.isBlank()) {
            updates["cardIdError"] = "Card ID is required"
            isValid = false
        }

        if (form.pin.isBlank()) {
            updates["pinError"] = "PIN is required"
            isValid = false
        } else if (form.pin.length != 4) {
            updates["pinError"] = "PIN must be 4 digits"
            isValid = false
        }

        if (updates.isNotEmpty()) {
            _formState.update {
                var updated = it
                updates.forEach { (field, error) ->
                    updated = when (field) {
                        "cardIdError" -> updated.copy(cardIdError = error)
                        "pinError" -> updated.copy(pinError = error)
                        else -> updated
                    }
                }
                updated
            }
        }

        return isValid
    }

    private fun performCardLogin(cardId: String, pin: String) {
        _loginInProgress.value = true
        setLoading(true)

        viewModelScope.launch {
            val result = authRepository.loginWithCard(cardId, pin)
            handleLoginResult(result)
        }
    }

    // =====================================================================
    // Result Handling
    // =====================================================================

    private fun handleLoginResult(result: NetworkResult<UserProfile>) {
        when (result) {
            is NetworkResult.Success -> {
                setLoading(false)
                _loginInProgress.value = false
                updateState { it.copy(isSuccess = true, user = result.data) }
                clearError()
                // Navigate to dashboard after short delay
                viewModelScope.launch {
                    kotlinx.coroutines.delay(500)
                    // Navigate (will be handled by parent)
                }
            }
            is NetworkResult.Error -> {
                setLoading(false)
                _loginInProgress.value = false
                setError(result.message)
            }
            is NetworkResult.Unauthorized -> {
                setLoading(false)
                _loginInProgress.value = false
                setError("Invalid credentials. Please check and try again.")
            }
            is NetworkResult.Loading -> {
                setLoading(true)
            }
        }
    }

    // =====================================================================
    // State Management
    // =====================================================================

    fun resetForm() {
        _formState.value = LoginFormState()
        updateState { it.copy(isSuccess = false, user = null) }
        clearError()
    }

    fun clearLoginSuccess() {
        updateState { it.copy(isSuccess = false) }
    }
}

/**
 * Represents the login form input state and validation errors.
 */
data class LoginFormState(
    val isCardMode: Boolean = false,
    // Email/Password mode
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val passwordError: String? = null,
    // Card/PIN mode
    val cardId: String = "",
    val pin: String = "",
    val cardIdError: String? = null,
    val pinError: String? = null
)

/**
 * Represents the complete login screen state.
 */
data class LoginScreenState(
    val isSuccess: Boolean = false,
    val user: UserProfile? = null
)

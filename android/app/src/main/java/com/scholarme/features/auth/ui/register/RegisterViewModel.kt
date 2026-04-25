package com.scholarme.features.auth.ui.register

import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.core.presentation.NavigationEvent
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the Register screen (Vertical Slice — Auth Feature).
 *
 * Migrated to:
 * - @HiltViewModel + @Inject constructor (eliminates RegisterViewModelFactory)
 * - BaseViewModel<RegisterScreenState> for consistent state management
 * - NetworkResult for unified result handling
 */
@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : BaseViewModel<RegisterScreenState>() {

    private val _formState = MutableStateFlow(RegisterFormState())
    val formState: StateFlow<RegisterFormState> = _formState.asStateFlow()

    override fun createInitialState() = RegisterScreenState()

    fun updateFullName(value: String) = _formState.update { it.copy(fullName = value, fullNameError = null) }
    fun updateEmail(value: String) = _formState.update { it.copy(email = value, emailError = null) }
    fun updatePassword(value: String) = _formState.update { it.copy(password = value, passwordError = null) }
    fun updateConfirmPassword(value: String) = _formState.update { it.copy(confirmPassword = value, confirmPasswordError = null) }

    fun register(
        fullName: String,
        email: String,
        password: String,
        confirmPassword: String,
        role: String = "LEARNER"
    ) {
        updateFullName(fullName)
        updateEmail(email)
        updatePassword(password)
        updateConfirmPassword(confirmPassword)

        if (!validateForm()) return

        setLoading(true)
        viewModelScope.launch {
            val result = authRepository.register(email, password, fullName, role)
            setLoading(false)
            when (result) {
                is NetworkResult.Success -> {
                    updateState { it.copy(isSuccess = true) }
                    clearError()
                }
                is NetworkResult.Error -> setError(result.message)
                is NetworkResult.Unauthorized -> {
                    setError("Registration failed — please try again.")
                }
                else -> {}
            }
        }
    }

    private fun validateForm(): Boolean {
        val form = _formState.value
        var valid = true

        if (form.fullName.isBlank()) {
            _formState.update { it.copy(fullNameError = "Full name is required") }
            valid = false
        } else if (form.fullName.length < 2) {
            _formState.update { it.copy(fullNameError = "Name must be at least 2 characters") }
            valid = false
        }

        if (form.email.isBlank()) {
            _formState.update { it.copy(emailError = "Email is required") }
            valid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(form.email).matches()) {
            _formState.update { it.copy(emailError = "Invalid email format") }
            valid = false
        }

        if (form.password.isBlank()) {
            _formState.update { it.copy(passwordError = "Password is required") }
            valid = false
        } else if (form.password.length < 6) {
            _formState.update { it.copy(passwordError = "Password must be at least 6 characters") }
            valid = false
        }

        if (form.confirmPassword != form.password) {
            _formState.update { it.copy(confirmPasswordError = "Passwords do not match") }
            valid = false
        }

        return valid
    }

    fun resetState() {
        _formState.value = RegisterFormState()
        updateState { RegisterScreenState() }
        clearError()
    }
}

data class RegisterFormState(
    val fullName: String = "",
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val fullNameError: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val confirmPasswordError: String? = null
)

data class RegisterScreenState(
    val isSuccess: Boolean = false
)

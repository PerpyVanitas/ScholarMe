package com.scholarme.features.profile.ui.change_password

import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.core.presentation.NavigationEvent
import com.scholarme.features.profile.data.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the Change Password screen (Vertical Slice — Profile Feature).
 *
 * Migrated to @HiltViewModel + BaseViewModel<ChangePasswordScreenState>.
 */
@HiltViewModel
class ChangePasswordViewModel @Inject constructor(
    private val repository: ProfileRepository
) : BaseViewModel<ChangePasswordScreenState>() {

    private val _formState = MutableStateFlow(ChangePasswordFormState())
    val formState: StateFlow<ChangePasswordFormState> = _formState.asStateFlow()

    override fun createInitialState() = ChangePasswordScreenState()

    fun changePassword(
        currentPassword: String,
        newPassword: String,
        confirmPassword: String
    ) {
        if (!validateForm(currentPassword, newPassword, confirmPassword)) return

        setLoading(true)
        viewModelScope.launch {
            val result = repository.changePassword(currentPassword, newPassword)
            setLoading(false)
            when (result) {
                is NetworkResult.Success -> {
                    updateState { it.copy(isSuccess = true) }
                    clearError()
                }
                is NetworkResult.Error -> setError(result.message)
                is NetworkResult.Unauthorized -> {
                    setError("Session expired.")
                    navigate(NavigationEvent.NavigateToLogin)
                }
                else -> {}
            }
        }
    }

    private fun validateForm(
        currentPassword: String,
        newPassword: String,
        confirmPassword: String
    ): Boolean {
        var valid = true

        val currentError = when {
            currentPassword.isBlank() -> "Current password is required"
            else -> null
        }
        val newError = when {
            newPassword.isBlank() -> "New password is required"
            newPassword.length < 6 -> "Password must be at least 6 characters"
            else -> null
        }
        val confirmError = when {
            confirmPassword != newPassword -> "Passwords do not match"
            else -> null
        }

        _formState.update {
            it.copy(
                currentPasswordError = currentError,
                newPasswordError = newError,
                confirmPasswordError = confirmError
            )
        }

        if (currentError != null || newError != null || confirmError != null) valid = false
        return valid
    }
}

data class ChangePasswordFormState(
    val currentPasswordError: String? = null,
    val newPasswordError: String? = null,
    val confirmPasswordError: String? = null
)

data class ChangePasswordScreenState(
    val isSuccess: Boolean = false
)

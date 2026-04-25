package com.scholarme.features.profile.ui.update

import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
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
 * ViewModel for Update Profile screen (Vertical Slice — Profile Feature).
 *
 * Migrated to @HiltViewModel + BaseViewModel<UpdateProfileScreenState>.
 */
@HiltViewModel
class UpdateProfileViewModel @Inject constructor(
    private val repository: ProfileRepository
) : BaseViewModel<UpdateProfileScreenState>() {

    private val _formState = MutableStateFlow(UpdateProfileFormState())
    val formState: StateFlow<UpdateProfileFormState> = _formState.asStateFlow()

    override fun createInitialState() = UpdateProfileScreenState()

    init {
        loadCurrentProfile()
    }

    private fun loadCurrentProfile() {
        viewModelScope.launch {
            val result = repository.getProfile()
            if (result is NetworkResult.Success) {
                updateState { it.copy(currentProfile = result.data) }
            }
        }
    }

    fun updateProfile(fullName: String, phone: String?, bio: String?) {
        if (fullName.isBlank()) {
            _formState.update { it.copy(fullNameError = "Full name is required") }
            return
        }
        _formState.update { it.copy(fullNameError = null) }

        setLoading(true)
        viewModelScope.launch {
            val result = repository.updateProfile(fullName, phone, bio)
            setLoading(false)
            when (result) {
                is NetworkResult.Success -> {
                    updateState { it.copy(isSuccess = true, currentProfile = result.data) }
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
}

data class UpdateProfileFormState(
    val fullNameError: String? = null
)

data class UpdateProfileScreenState(
    val currentProfile: UserProfile? = null,
    val isSuccess: Boolean = false
)

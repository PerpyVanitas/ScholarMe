package com.scholarme.features.profile.ui

import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.core.presentation.NavigationEvent
import com.scholarme.features.profile.data.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the Profile screen (Vertical Slice — Profile Feature).
 *
 * Migrated to @HiltViewModel + BaseViewModel<ProfileScreenState>.
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository
) : BaseViewModel<ProfileScreenState>() {

    override fun createInitialState() = ProfileScreenState()

    init {
        loadProfile()
    }

    fun loadProfile() {
        setLoading(true)
        viewModelScope.launch {
            val result = repository.getProfile()
            setLoading(false)
            when (result) {
                is NetworkResult.Success -> {
                    updateState { it.copy(profile = result.data) }
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

data class ProfileScreenState(
    val profile: UserProfile? = null
)

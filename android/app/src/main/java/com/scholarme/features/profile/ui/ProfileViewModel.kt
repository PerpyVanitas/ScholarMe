package com.scholarme.features.profile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.ProfileDto
import com.scholarme.core.util.Result
import com.scholarme.features.profile.data.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository,
    private val tokenManager: TokenManager
) : ViewModel() {
    
    private val _profileState = MutableStateFlow<Result<ProfileDto>>(Result.Loading)
    val profileState: StateFlow<Result<ProfileDto>> = _profileState
    
    init {
        loadProfile()
    }
    
    fun loadProfile() {
        viewModelScope.launch {
            _profileState.value = Result.Loading
            // In a real app, repository would return ProfileDto
            // Mapping for the demo
            val result = repository.getProfile()
            _profileState.value = result
        }
    }

    fun logout() {
        tokenManager.clearToken()
    }
}

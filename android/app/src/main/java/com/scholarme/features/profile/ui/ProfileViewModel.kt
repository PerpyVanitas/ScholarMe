package com.scholarme.features.profile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.profile.data.model.UserProfile
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
    
    private val _profileState = MutableStateFlow<Result<UserProfile>>(Result.Loading)
    val profileState: StateFlow<Result<UserProfile>> = _profileState
    
    init {
        loadProfile()
    }
    
    fun loadProfile() {
        viewModelScope.launch {
            _profileState.value = Result.Loading
            val result = repository.getProfile()
            _profileState.value = result
        }
    }

    fun logout() {
        tokenManager.clearAll()
    }
}

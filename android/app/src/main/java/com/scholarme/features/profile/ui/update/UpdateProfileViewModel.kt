package com.scholarme.features.profile.ui.update

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.util.Result
import com.scholarme.features.profile.data.ProfileRepository
import kotlinx.coroutines.launch

class UpdateProfileViewModel(private val repository: ProfileRepository) : ViewModel() {
    
    private val _currentProfile = MutableLiveData<Result<UserProfile>>()
    val currentProfile: LiveData<Result<UserProfile>> = _currentProfile
    
    private val _updateState = MutableLiveData<Result<UserProfile>?>()
    val updateState: LiveData<Result<UserProfile>?> = _updateState
    
    private val _fullNameError = MutableLiveData<String?>()
    val fullNameError: LiveData<String?> = _fullNameError
    
    init {
        loadCurrentProfile()
    }
    
    private fun loadCurrentProfile() {
        viewModelScope.launch {
            _currentProfile.value = repository.getProfile()
        }
    }
    
    fun updateProfile(
        fullName: String,
        phone: String?,
        bio: String?
    ) {
        // Validate
        if (fullName.isBlank()) {
            _fullNameError.value = "Full name is required"
            return
        }
        _fullNameError.value = null
        
        _updateState.value = Result.Loading
        
        viewModelScope.launch {
            _updateState.value = repository.updateProfile(
                fullName = fullName,
                phone = phone,
                bio = bio
            )
        }
    }
}

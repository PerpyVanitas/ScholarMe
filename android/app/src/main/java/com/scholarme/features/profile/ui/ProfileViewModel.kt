package com.scholarme.features.profile.ui

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.util.Result
import com.scholarme.features.profile.data.ProfileRepository
import kotlinx.coroutines.launch

class ProfileViewModel(private val repository: ProfileRepository) : ViewModel() {
    
    private val _profileState = MutableLiveData<Result<UserProfile>>()
    val profileState: LiveData<Result<UserProfile>> = _profileState
    
    init {
        loadProfile()
    }
    
    fun loadProfile() {
        _profileState.value = Result.Loading
        viewModelScope.launch {
            _profileState.value = repository.getProfile()
        }
    }
}

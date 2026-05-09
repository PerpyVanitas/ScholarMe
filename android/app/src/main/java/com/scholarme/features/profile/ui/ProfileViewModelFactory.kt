package com.scholarme.features.profile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.profile.data.ProfileRepository

class ProfileViewModelFactory(
    private val repository: ProfileRepository,
    private val tokenManager: TokenManager
) : ViewModelProvider.Factory {
    
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ProfileViewModel::class.java)) {
            return ProfileViewModel(repository, tokenManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

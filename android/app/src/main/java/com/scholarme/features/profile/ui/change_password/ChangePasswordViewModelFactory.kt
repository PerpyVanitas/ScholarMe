package com.scholarme.features.profile.ui.change_password

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.scholarme.features.profile.data.ProfileRepository

class ChangePasswordViewModelFactory(
    private val repository: ProfileRepository
) : ViewModelProvider.Factory {
    
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ChangePasswordViewModel::class.java)) {
            return ChangePasswordViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

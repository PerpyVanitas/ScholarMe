package com.scholarme.features.profile.ui.change_password

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.profile.data.ProfileRepository
import kotlinx.coroutines.launch

class ChangePasswordViewModel(private val repository: ProfileRepository) : ViewModel() {
    
    private val _changePasswordState = MutableLiveData<Result<Unit>?>()
    val changePasswordState: LiveData<Result<Unit>?> = _changePasswordState
    
    private val _currentPasswordError = MutableLiveData<String?>()
    val currentPasswordError: LiveData<String?> = _currentPasswordError
    
    private val _newPasswordError = MutableLiveData<String?>()
    val newPasswordError: LiveData<String?> = _newPasswordError
    
    private val _confirmPasswordError = MutableLiveData<String?>()
    val confirmPasswordError: LiveData<String?> = _confirmPasswordError
    
    fun changePassword(
        currentPassword: String,
        newPassword: String,
        confirmPassword: String
    ) {
        // Validate inputs
        var hasError = false
        
        if (currentPassword.isBlank()) {
            _currentPasswordError.value = "Current password is required"
            hasError = true
        } else {
            _currentPasswordError.value = null
        }
        
        if (newPassword.isBlank()) {
            _newPasswordError.value = "New password is required"
            hasError = true
        } else if (newPassword.length < 6) {
            _newPasswordError.value = "Password must be at least 6 characters"
            hasError = true
        } else {
            _newPasswordError.value = null
        }
        
        if (confirmPassword != newPassword) {
            _confirmPasswordError.value = "Passwords do not match"
            hasError = true
        } else {
            _confirmPasswordError.value = null
        }
        
        if (hasError) return
        
        _changePasswordState.value = Result.Loading
        
        viewModelScope.launch {
            _changePasswordState.value = repository.changePassword(currentPassword, newPassword)
        }
    }
}

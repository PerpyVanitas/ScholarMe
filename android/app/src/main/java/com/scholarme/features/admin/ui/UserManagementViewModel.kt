package com.scholarme.features.admin.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.admin.data.AdminRepository
import com.scholarme.features.profile.data.model.UserProfile
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserManagementViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _users = MutableStateFlow<Result<List<UserProfile>>>(Result.Loading)
    val users: StateFlow<Result<List<UserProfile>>> = _users

    init {
        loadUsers()
    }

    fun loadUsers(search: String? = null, role: String? = null) {
        viewModelScope.launch {
            _users.value = Result.Loading
            _users.value = repository.getUsers()
        }
    }

    fun updateUserRole(userId: String, newRole: String) {
        viewModelScope.launch {
            val result = repository.updateUserRole(userId, newRole)
            if (result is Result.Success) {
                loadUsers()
            }
        }
    }
}

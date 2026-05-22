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

    private val _actionStatus = MutableStateFlow<Result<Unit>?>(null)
    val actionStatus: StateFlow<Result<Unit>?> = _actionStatus

    fun loadUsers() {
        viewModelScope.launch {
            _users.value = Result.Loading
            _users.value = repository.getUsers()
        }
    }

    fun createUser(email: String, pass: String, name: String, role: String) {
        viewModelScope.launch {
            _actionStatus.value = Result.Loading
            val result = repository.createUser(email, pass, name, role)
            _actionStatus.value = result
            if (result is Result.Success) loadUsers()
        }
    }

    fun editUser(userId: String, name: String?, email: String?, role: String?, pass: String?) {
        viewModelScope.launch {
            _actionStatus.value = Result.Loading
            val result = repository.editUser(userId, name, email, role, pass)
            _actionStatus.value = result
            if (result is Result.Success) loadUsers()
        }
    }

    fun deleteUser(userId: String) {
        viewModelScope.launch {
            _actionStatus.value = Result.Loading
            val result = repository.deleteUser(userId)
            _actionStatus.value = result
            if (result is Result.Success) loadUsers()
        }
    }

    fun toggleCardStatus(userId: String, isIssued: Boolean) {
        viewModelScope.launch {
            _actionStatus.value = Result.Loading
            val result = repository.toggleCardStatus(userId, isIssued)
            _actionStatus.value = result
            if (result is Result.Success) loadUsers()
        }
    }

    fun resetActionStatus() {
        _actionStatus.value = null
    }
}

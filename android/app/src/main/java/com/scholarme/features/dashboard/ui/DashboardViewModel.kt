package com.scholarme.features.dashboard.ui

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.DashboardStats
import com.scholarme.core.data.model.Session
import com.scholarme.core.util.Result
import com.scholarme.features.dashboard.data.DashboardRepository
import kotlinx.coroutines.launch

/**
 * ViewModel for the Dashboard screen.
 * Manages dashboard stats and upcoming sessions.
 */
class DashboardViewModel(private val repository: DashboardRepository) : ViewModel() {
    
    private val _statsState = MutableLiveData<Result<DashboardStats>>()
    val statsState: LiveData<Result<DashboardStats>> = _statsState
    
    private val _sessionsState = MutableLiveData<Result<List<Session>>>()
    val sessionsState: LiveData<Result<List<Session>>> = _sessionsState
    
    private val _userName = MutableLiveData<String>()
    val userName: LiveData<String> = _userName
    
    private val _userRole = MutableLiveData<String>()
    val userRole: LiveData<String> = _userRole
    
    init {
        loadUserInfo()
        loadDashboard()
    }
    
    private fun loadUserInfo() {
        _userName.value = repository.getUserName()
        _userRole.value = repository.getUserRole()
    }
    
    fun loadDashboard() {
        loadStats()
        loadSessions()
    }
    
    private fun loadStats() {
        _statsState.value = Result.Loading
        viewModelScope.launch {
            _statsState.value = repository.getDashboardStats()
        }
    }
    
    private fun loadSessions() {
        _sessionsState.value = Result.Loading
        viewModelScope.launch {
            _sessionsState.value = repository.getUpcomingSessions()
        }
    }
    
    fun refresh() {
        loadDashboard()
    }
}

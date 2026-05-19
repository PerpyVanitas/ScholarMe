package com.scholarme.features.dashboard.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.dashboard.domain.repository.DashboardRepository
import com.scholarme.features.dashboard.domain.model.Session
import com.scholarme.features.dashboard.domain.model.DashboardStats
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: DashboardRepository
) : ViewModel() {

    private val _sessions = MutableStateFlow<Result<List<Session>>>(Result.Loading)
    val sessions: StateFlow<Result<List<Session>>> = _sessions

    private val _stats = MutableStateFlow<Result<DashboardStats>>(Result.Loading)
    val stats: StateFlow<Result<DashboardStats>> = _stats

    private val _userName = MutableStateFlow("Scholar")
    val userName: StateFlow<String> = _userName

    private val _userRole = MutableStateFlow("learner")
    val userRole: StateFlow<String> = _userRole

    init {
        _userName.value = repository.getUserName()
        _userRole.value = repository.getUserRole()
        fetchDashboardData()
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            launch {
                repository.getUpcomingSessions().collectLatest {
                    _sessions.value = it
                }
            }
            launch {
                repository.getDashboardStats().collectLatest {
                    _stats.value = it
                }
            }
        }
    }
}

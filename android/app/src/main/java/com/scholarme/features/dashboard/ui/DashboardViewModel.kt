package com.scholarme.features.dashboard.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.dashboard.domain.repository.DashboardRepository
import com.scholarme.features.dashboard.domain.model.Session
import com.scholarme.core.network.NetworkResult
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

    private val _sessions = MutableStateFlow<NetworkResult<List<Session>>>(NetworkResult.Loading())
    val sessions: StateFlow<NetworkResult<List<Session>>> = _sessions

    private val _userName = MutableStateFlow("Scholar")
    val userName: StateFlow<String> = _userName

    init {
        _userName.value = repository.getUserName()
        fetchDashboardData()
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            repository.getUpcomingSessions().collectLatest {
                _sessions.value = it
            }
        }
    }

    fun logout() {
        // Handled via AuthRepository usually, but we can add a logout to DashboardRepo if needed
    }
}

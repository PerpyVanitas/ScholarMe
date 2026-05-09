package com.scholarme.features.dashboard.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.SessionDto
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _sessions = MutableStateFlow<Result<List<SessionDto>>>(Result.Loading)
    val sessions: StateFlow<Result<List<SessionDto>>> = _sessions

    private val _userName = MutableStateFlow("Scholar")
    val userName: StateFlow<String> = _userName

    init {
        fetchDashboardData()
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            _sessions.value = Result.Loading
            try {
                // Fetch profile to get name
                val profileRes = apiService.getProfile()
                if (profileRes.isSuccessful) {
                    _userName.value = profileRes.body()?.data?.fullName ?: "Scholar"
                }

                // Fetch upcoming sessions
                val sessionsRes = apiService.getSessions()
                if (sessionsRes.isSuccessful) {
                    _sessions.value = Result.Success(sessionsRes.body()?.data ?: emptyList())
                } else {
                    _sessions.value = Result.Error("Failed to load sessions")
                }
            } catch (e: Exception) {
                _sessions.value = Result.Error(e.message ?: "Network error")
            }
        }
    }

    fun logout() {
        tokenManager.clearToken()
    }
}

package com.scholarme.features.gamification.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.features.gamification.data.GamificationRepository
import com.scholarme.features.gamification.data.LeaderboardUserDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LeaderboardViewModel @Inject constructor(
    private val repository: GamificationRepository
) : ViewModel() {

    private val _leaderboard = MutableStateFlow<List<LeaderboardUserDto>>(emptyList())
    val leaderboard: StateFlow<List<LeaderboardUserDto>> = _leaderboard.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadLeaderboard()
    }

    fun loadLeaderboard() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getLeaderboard()) {
                is NetworkResult.Success -> _leaderboard.value = result.data
                else -> {}
            }
            _isLoading.value = false
        }
    }
}

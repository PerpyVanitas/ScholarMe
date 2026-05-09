package com.scholarme.features.gamification.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.gamification.data.GamificationRepository
import com.scholarme.features.gamification.data.model.LeaderboardEntry
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

    private val _uiState = MutableStateFlow<Result<List<LeaderboardEntry>>>(Result.Loading)
    val uiState: StateFlow<Result<List<LeaderboardEntry>>> = _uiState.asStateFlow()

    init {
        loadLeaderboard()
    }

    fun loadLeaderboard() {
        viewModelScope.launch {
            _uiState.value = Result.Loading
            when (val result = repository.getLeaderboard()) {
                is Result.Success -> _uiState.value = Result.Success(result.data.leaderboard)
                is Result.Error -> _uiState.value = Result.Error(result.message)
                else -> {}
            }
        }
    }
}

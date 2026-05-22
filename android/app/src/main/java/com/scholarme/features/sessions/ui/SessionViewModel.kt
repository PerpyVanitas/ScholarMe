package com.scholarme.features.sessions.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.sessions.data.model.SessionDto
import com.scholarme.features.sessions.data.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import com.scholarme.features.gamification.data.GamificationRepository

data class SessionListState(
    val sessions: List<SessionDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class SessionViewModel @Inject constructor(
    private val repository: SessionRepository,
    private val gamificationRepository: GamificationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SessionListState())
    val uiState: StateFlow<SessionListState> = _uiState.asStateFlow()

    init {
        loadSessions()
    }

    fun loadSessions() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            when (val result = repository.getSessions()) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        sessions = result.data.sessions,
                        isLoading = false
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(
                        error = result.message,
                        isLoading = false
                    )
                }
                else -> {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
            }
        }
    }

    fun markSessionComplete(sessionId: String, durationHours: Int = 1, onXpEarned: (Int) -> Unit = {}) {
        viewModelScope.launch {
            // Usually we would update session status on backend first via repository.
            // Reward 25 XP per hour of tutoring
            val xpAmount = durationHours * 25
            val result = gamificationRepository.awardXp(xpAmount, "Completed Tutoring Session")
            if (result is Result.Success) {
                onXpEarned(result.data.xpEarned)
                loadSessions()
            }
        }
    }
}

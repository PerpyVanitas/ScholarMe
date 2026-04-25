package com.scholarme.features.dashboard.ui

import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.DashboardStats
import com.scholarme.core.data.model.SessionDto
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.features.dashboard.data.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the Dashboard screen (Vertical Slice — Dashboard Feature).
 *
 * Migrated to:
 * - @HiltViewModel for Hilt injection (eliminates DashboardViewModelFactory)
 * - BaseViewModel<DashboardScreenState> for StateFlow infrastructure
 * - NetworkResult for unified result handling
 * - Parallel loading of stats + sessions via async/await
 */
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: DashboardRepository
) : BaseViewModel<DashboardScreenState>() {

    override fun createInitialState() = DashboardScreenState(
        userName = repository.getUserName(),
        userRole = repository.getUserRole()
    )

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        setLoading(true)
        viewModelScope.launch {
            // Load stats and sessions in parallel
            val statsDeferred = async { repository.getDashboardStats() }
            val sessionsDeferred = async { repository.getUpcomingSessions() }

            val statsResult = statsDeferred.await()
            val sessionsResult = sessionsDeferred.await()

            setLoading(false)

            // Handle stats result
            when (statsResult) {
                is NetworkResult.Success -> updateState { it.copy(stats = statsResult.data) }
                is NetworkResult.Error -> setError(statsResult.message)
                is NetworkResult.Unauthorized -> {
                    setError("Session expired. Please log in again.")
                    navigate(com.scholarme.core.presentation.NavigationEvent.NavigateToLogin)
                }
                else -> {}
            }

            // Handle sessions result independently — don't fail both on one error
            when (sessionsResult) {
                is NetworkResult.Success -> updateState { it.copy(sessions = sessionsResult.data) }
                is NetworkResult.Error -> updateState { it.copy(sessionsError = sessionsResult.message) }
                is NetworkResult.Unauthorized -> {
                    navigate(com.scholarme.core.presentation.NavigationEvent.NavigateToLogin)
                }
                else -> {}
            }
        }
    }

    fun refresh() {
        updateState { it.copy(sessionsError = null) }
        clearError()
        loadDashboard()
    }
}

/**
 * Immutable state for the Dashboard screen.
 * Drives all UI rendering — single source of truth.
 */
data class DashboardScreenState(
    val userName: String = "User",
    val userRole: String = "learner",
    val stats: DashboardStats = DashboardStats(),
    val sessions: List<SessionDto> = emptyList(),
    val sessionsError: String? = null
)

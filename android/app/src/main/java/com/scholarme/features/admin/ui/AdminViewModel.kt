package com.scholarme.features.admin.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.admin.data.model.*
import com.scholarme.features.auth.data.model.AuthCard
import com.scholarme.features.admin.data.AdminRepository
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _analytics = MutableStateFlow<Result<AdminAnalytics>>(Result.Loading)
    val analytics: StateFlow<Result<AdminAnalytics>> = _analytics

    private val _timesheets = MutableStateFlow<Result<List<AdminTimesheet>>>(Result.Loading)
    val timesheets: StateFlow<Result<List<AdminTimesheet>>> = _timesheets

    private val _auditLogs = MutableStateFlow<Result<List<AuditLogEntry>>>(Result.Loading)
    val auditLogs: StateFlow<Result<List<AuditLogEntry>>> = _auditLogs

    private val _cards = MutableStateFlow<Result<List<AuthCard>>>(Result.Loading)
    val cards: StateFlow<Result<List<AuthCard>>> = _cards

    fun fetchAnalytics() {
        viewModelScope.launch {
            _analytics.value = Result.Loading
            _analytics.value = repository.getAnalytics()
        }
    }

    fun fetchTimesheets() {
        viewModelScope.launch {
            _timesheets.value = Result.Loading
            _timesheets.value = repository.getTimesheets()
        }
    }

    fun approveTimesheet(id: String) {
        viewModelScope.launch {
            repository.updateTimesheetStatus(id, "approved")
            fetchTimesheets()
        }
    }

    fun rejectTimesheet(id: String) {
        viewModelScope.launch {
            repository.updateTimesheetStatus(id, "rejected")
            fetchTimesheets()
        }
    }

    fun fetchAuditLogs(userId: String) {
        viewModelScope.launch {
            _auditLogs.value = Result.Loading
            _auditLogs.value = repository.getAuditLogs(userId)
        }
    }

    fun fetchCards() {
        viewModelScope.launch {
            _cards.value = Result.Loading
            _cards.value = repository.getCards()
        }
    }

    fun issueCard(userId: String, cardId: String, pin: String) {
        viewModelScope.launch {
            // Simulated issue card logic
            repository.issueCard(userId, cardId, pin)
            fetchCards()
        }
    }
}

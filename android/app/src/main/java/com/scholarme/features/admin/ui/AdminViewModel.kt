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

    private val _analytics = MutableStateFlow<AdminAnalytics?>(null)
    val analytics: StateFlow<AdminAnalytics?> = _analytics

    private val _timesheets = MutableStateFlow<List<AdminTimesheet>>(emptyList())
    val timesheets: StateFlow<List<AdminTimesheet>> = _timesheets

    private val _auditLogs = MutableStateFlow<List<AuditLogEntry>>(emptyList())
    val auditLogs: StateFlow<List<AuditLogEntry>> = _auditLogs

    private val _cards = MutableStateFlow<List<AuthCard>>(emptyList())
    val cards: StateFlow<List<AuthCard>> = _cards

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun fetchAnalytics() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getAnalytics()) {
                is Result.Success -> {
                    _analytics.value = result.data
                    _error.value = null
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            _isLoading.value = false
        }
    }

    fun fetchTimesheets() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getTimesheets()) {
                is Result.Success -> {
                    _timesheets.value = result.data
                    _error.value = null
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            _isLoading.value = false
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
            _isLoading.value = true
            when (val result = repository.getAuditLogs(userId)) {
                is Result.Success -> {
                    _auditLogs.value = result.data
                    _error.value = null
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            _isLoading.value = false
        }
    }

    fun fetchCards() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getCards()) {
                is Result.Success -> {
                    _cards.value = result.data
                    _error.value = null
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            _isLoading.value = false
        }
    }
}

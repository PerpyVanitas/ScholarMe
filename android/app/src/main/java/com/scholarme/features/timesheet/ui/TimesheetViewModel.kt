package com.scholarme.features.timesheet.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.features.timesheet.data.TimesheetEntryDto
import com.scholarme.features.timesheet.data.TimesheetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TimesheetViewModel @Inject constructor(
    private val repository: TimesheetRepository
) : ViewModel() {

    private val _activeEntry = MutableStateFlow<TimesheetEntryDto?>(null)
    val activeEntry: StateFlow<TimesheetEntryDto?> = _activeEntry.asStateFlow()

    private val _history = MutableStateFlow<List<TimesheetEntryDto>>(emptyList())
    val history: StateFlow<List<TimesheetEntryDto>> = _history.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadTimesheetData()
    }

    private fun loadTimesheetData() {
        viewModelScope.launch {
            _isLoading.value = true
            
            when (val activeResult = repository.getActiveTimesheet()) {
                is NetworkResult.Success -> _activeEntry.value = activeResult.data
                else -> {}
            }
            
            when (val historyResult = repository.getTimesheetHistory()) {
                is NetworkResult.Success -> _history.value = historyResult.data
                else -> {}
            }
            
            _isLoading.value = false
        }
    }

    fun toggleClockStatus() {
        viewModelScope.launch {
            _isLoading.value = true
            if (_activeEntry.value == null) {
                when (val result = repository.clockIn()) {
                    is NetworkResult.Success -> _activeEntry.value = result.data
                    else -> {}
                }
            } else {
                when (repository.clockOut()) {
                    is NetworkResult.Success -> loadTimesheetData() // Reload both active and history
                    else -> {}
                }
            }
            _isLoading.value = false
        }
    }
}

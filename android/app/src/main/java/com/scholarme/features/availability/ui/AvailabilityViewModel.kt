package com.scholarme.features.availability.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.availability.data.AvailabilityRepository
import com.scholarme.features.availability.data.model.TimeSlotDto
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AvailabilityViewModel @Inject constructor(
    private val repository: AvailabilityRepository
) : ViewModel() {

    private val _availability = MutableStateFlow<Result<List<TimeSlotDto>>>(Result.Loading)
    val availability: StateFlow<Result<List<TimeSlotDto>>> = _availability

    private val _updateResult = MutableStateFlow<Result<Unit>?>(null)
    val updateResult: StateFlow<Result<Unit>?> = _updateResult

    init {
        loadAvailability()
    }

    fun loadAvailability() {
        viewModelScope.launch {
            _availability.value = Result.Loading
            _availability.value = repository.getAvailability()
        }
    }

    fun saveAvailability(slots: List<TimeSlotDto>) {
        viewModelScope.launch {
            _updateResult.value = Result.Loading
            _updateResult.value = repository.updateAvailability(slots)
            if (_updateResult.value is Result.Success) {
                loadAvailability()
            }
        }
    }

    fun toggleTutorStatus(isAvailable: Boolean) {
        viewModelScope.launch {
            repository.updateTutorStatus(isAvailable)
        }
    }
}

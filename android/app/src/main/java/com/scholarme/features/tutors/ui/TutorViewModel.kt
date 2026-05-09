package com.scholarme.features.tutors.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.tutors.data.model.TutorDto
import com.scholarme.features.tutors.data.TutorRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TutorListState(
    val tutors: List<TutorDto> = emptyList(),
    val filteredTutors: List<TutorDto> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class TutorViewModel @Inject constructor(
    private val repository: TutorRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TutorListState())
    val uiState: StateFlow<TutorListState> = _uiState.asStateFlow()

    init {
        loadTutors()
    }

    private fun loadTutors() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            when (val result = repository.getTutors()) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        tutors = result.data.tutors,
                        filteredTutors = result.data.tutors,
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

    fun onSearchQueryChanged(query: String) {
        val filtered = if (query.isEmpty()) {
            _uiState.value.tutors
        } else {
            _uiState.value.tutors.filter {
                it.fullName.contains(query, ignoreCase = true) ||
                it.bio.contains(query, ignoreCase = true)
            }
        }
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            filteredTutors = filtered
        )
    }
}

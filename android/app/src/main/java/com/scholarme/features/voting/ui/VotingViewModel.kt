package com.scholarme.features.voting.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.voting.data.model.PollDto
import com.scholarme.features.voting.data.VotingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VotingListState(
    val polls: List<PollDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class VotingViewModel @Inject constructor(
    private val repository: VotingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(VotingListState())
    val uiState: StateFlow<VotingListState> = _uiState.asStateFlow()

    init {
        loadPolls()
    }

    private fun loadPolls() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = repository.getActivePolls()) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        polls = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                else -> {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
            }
        }
    }

    fun castVote(pollId: String, optionId: String) {
        viewModelScope.launch {
            when (repository.castVote(pollId, optionId)) {
                is Result.Success -> {
                    loadPolls()
                }
                else -> {}
            }
        }
    }
}

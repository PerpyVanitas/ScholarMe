package com.scholarme.features.voting.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.features.voting.data.PollDto
import com.scholarme.features.voting.data.VotingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VotingViewModel @Inject constructor(
    private val repository: VotingRepository
) : ViewModel() {

    private val _polls = MutableStateFlow<List<PollDto>>(emptyList())
    val polls: StateFlow<List<PollDto>> = _polls.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadPolls()
    }

    private fun loadPolls() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getActivePolls()) {
                is NetworkResult.Success -> {
                    _polls.value = result.data
                }
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun castVote(pollId: String, optionId: String) {
        viewModelScope.launch {
            when (repository.castVote(pollId, optionId)) {
                is NetworkResult.Success -> {
                    loadPolls() // Reload to get updated vote counts
                }
                else -> {}
            }
        }
    }
}

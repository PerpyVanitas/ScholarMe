package com.scholarme.features.messaging.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.util.Result
import com.scholarme.features.messaging.data.model.*
import com.scholarme.features.messaging.data.MessagingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import javax.inject.Inject

data class MessagingState(
    val conversations: List<ConversationDto> = emptyList(),
    val activeMessages: List<MessageDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class MessagingViewModel @Inject constructor(
    private val repository: MessagingRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MessagingState())
    val uiState: StateFlow<MessagingState> = _uiState.asStateFlow()

    // Separate flow for chat screen to prevent reloading conversations on every message
    private val _chatState = MutableStateFlow(MessagingState())
    val chatState: StateFlow<MessagingState> = _chatState.asStateFlow()

    init {
        loadConversations()
    }

    fun loadConversations() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = repository.getConversations()) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(
                        conversations = result.data,
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

    private var pollingJob: Job? = null

    fun loadMessages(conversationId: String) {
        stopPolling()
        viewModelScope.launch {
            _chatState.value = _chatState.value.copy(isLoading = true)
            when (val result = repository.getMessages(conversationId)) {
                is Result.Success -> {
                    _chatState.value = _chatState.value.copy(
                        activeMessages = result.data,
                        isLoading = false
                    )
                }
                else -> {
                    _chatState.value = _chatState.value.copy(isLoading = false)
                }
            }
            startPolling(conversationId)
        }
    }

    private fun startPolling(conversationId: String) {
        pollingJob = viewModelScope.launch {
            while (true) {
                delay(5000)
                when (val result = repository.getMessages(conversationId)) {
                    is Result.Success -> {
                        if (result.data.size > _chatState.value.activeMessages.size) {
                            _chatState.value = _chatState.value.copy(activeMessages = result.data)
                        }
                    }
                    else -> {}
                }
            }
        }
    }

    private fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    override fun onCleared() {
        super.onCleared()
        stopPolling()
    }

    fun sendMessage(conversationId: String, content: String) {
        viewModelScope.launch {
            when (val result = repository.sendMessage(conversationId, content)) {
                is Result.Success -> {
                    _chatState.value = _chatState.value.copy(
                        activeMessages = _chatState.value.activeMessages + result.data
                    )
                    loadConversations()
                }
                else -> {}
            }
        }
    }
}

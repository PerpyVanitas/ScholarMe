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

@HiltViewModel
class MessagingViewModel @Inject constructor(
    private val repository: MessagingRepository
) : ViewModel() {

    private val _conversations = MutableStateFlow<List<ConversationDto>>(emptyList())
    val conversations: StateFlow<List<ConversationDto>> = _conversations.asStateFlow()

    private val _activeMessages = MutableStateFlow<List<MessageDto>>(emptyList())
    val activeMessages: StateFlow<List<MessageDto>> = _activeMessages.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadConversations()
    }

    fun loadConversations() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getConversations()) {
                is Result.Success -> _conversations.value = result.data
                else -> {}
            }
            _isLoading.value = false
        }
    }

    private var pollingJob: Job? = null

    fun loadMessages(conversationId: String) {
        stopPolling()
        viewModelScope.launch {
            when (val result = repository.getMessages(conversationId)) {
                is Result.Success -> _activeMessages.value = result.data
                else -> {}
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
                        if (result.data.size > _activeMessages.value.size) {
                            _activeMessages.value = result.data
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
                    _activeMessages.value = _activeMessages.value + result.data
                    loadConversations()
                }
                else -> {}
            }
        }
    }
}

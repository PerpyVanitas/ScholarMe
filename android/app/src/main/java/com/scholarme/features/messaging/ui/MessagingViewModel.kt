package com.scholarme.features.messaging.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.features.messaging.data.ConversationDto
import com.scholarme.features.messaging.data.MessageDto
import com.scholarme.features.messaging.data.MessagingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
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
                is NetworkResult.Success -> _conversations.value = result.data
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun loadMessages(conversationId: String) {
        viewModelScope.launch {
            when (val result = repository.getMessages(conversationId)) {
                is NetworkResult.Success -> _activeMessages.value = result.data
                else -> {}
            }
        }
    }

    fun sendMessage(conversationId: String, content: String) {
        viewModelScope.launch {
            when (val result = repository.sendMessage(conversationId, content)) {
                is NetworkResult.Success -> {
                    // Optimistically append message
                    _activeMessages.value = _activeMessages.value + result.data
                    loadConversations() // Refresh lastMessage preview
                }
                else -> {}
            }
        }
    }
}

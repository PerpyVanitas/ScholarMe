package com.scholarme.features.messaging.data.model

import java.util.Date

data class MessageDto(
    val id: String,
    val content: String,
    val senderId: String,
    val createdAt: Date,
    val senderName: String,
    val senderAvatar: String? = null
)

data class ConversationDto(
    val id: String,
    val title: String,
    val lastMessage: String?,
    val updatedAt: Date,
    val unreadCount: Int = 0,
    val avatarUrl: String? = null
)

data class ConversationsResponse(
    val conversations: List<ConversationDto> = emptyList()
)

data class MessagesResponse(
    val conversationId: String,
    val messages: List<MessageDto> = emptyList()
)

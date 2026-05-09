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

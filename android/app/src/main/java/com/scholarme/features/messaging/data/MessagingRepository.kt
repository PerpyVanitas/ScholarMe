package com.scholarme.features.messaging.data

import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.Date
import javax.inject.Inject

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

class MessagingRepository @Inject constructor() {
    
    // Mock conversations for UI validation before backend API is ready
    private val mockConversations = mutableListOf(
        ConversationDto(
            id = "c1",
            title = "Dr. Alan Turing",
            lastMessage = "Yes, the homework is due on Friday.",
            updatedAt = Date(),
            unreadCount = 2
        ),
        ConversationDto(
            id = "c2",
            title = "Study Group A",
            lastMessage = "Who wants to meet at the library?",
            updatedAt = Date(System.currentTimeMillis() - 86400000)
        )
    )

    private val mockMessages = mutableListOf(
        MessageDto("m1", "Hello! I have a question about chapter 4.", "me", Date(System.currentTimeMillis() - 3600000), "Me"),
        MessageDto("m2", "Sure, what's your question?", "tutor1", Date(System.currentTimeMillis() - 3500000), "Dr. Alan Turing"),
        MessageDto("m3", "Yes, the homework is due on Friday.", "tutor1", Date(), "Dr. Alan Turing")
    )

    suspend fun getConversations(): NetworkResult<List<ConversationDto>> {
        return withContext(Dispatchers.IO) {
            delay(500)
            NetworkResult.Success(mockConversations.toList())
        }
    }

    suspend fun getMessages(conversationId: String): NetworkResult<List<MessageDto>> {
        return withContext(Dispatchers.IO) {
            delay(400)
            NetworkResult.Success(mockMessages.toList())
        }
    }

    suspend fun sendMessage(conversationId: String, content: String): NetworkResult<MessageDto> {
        return withContext(Dispatchers.IO) {
            delay(300)
            val newMsg = MessageDto(
                id = System.currentTimeMillis().toString(),
                content = content,
                senderId = "me", // Current user
                createdAt = Date(),
                senderName = "Me"
            )
            mockMessages.add(newMsg)
            
            // Update conversation lastMessage
            val idx = mockConversations.indexOfFirst { it.id == conversationId }
            if (idx != -1) {
                mockConversations[idx] = mockConversations[idx].copy(
                    lastMessage = content,
                    updatedAt = Date()
                )
            }
            
            NetworkResult.Success(newMsg)
        }
    }
}

package com.scholarme.features.messaging.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Date
import javax.inject.Inject

data class MessageDto(
    val id: String,
    val content: String,
    val senderId: String,
    val createdAt: Date,
    val senderName: String,
    val senderAvatar: String? = null,
    val isOwn: Boolean = false
)

data class ConversationDto(
    val id: String,
    val title: String,
    val lastMessage: String?,
    val updatedAt: Date,
    val unreadCount: Int = 0,
    val avatarUrl: String? = null
)

class MessagingRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    // Secondary constructor for non-Hilt usage
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getConversations(): NetworkResult<List<ConversationDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.getConversations(token)
                if (response.isSuccessful && response.body()?.success == true) {
                    val conversations = response.body()?.data?.conversations ?: emptyList()
                    NetworkResult.Success(conversations.map { c ->
                        ConversationDto(
                            id = c.id,
                            title = c.title,
                            lastMessage = c.lastMessage,
                            updatedAt = try { Date(c.updatedAt) } catch (_: Exception) { Date() },
                            unreadCount = c.unreadCount,
                            avatarUrl = c.avatarUrl
                        )
                    })
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to load conversations")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }

    suspend fun getMessages(conversationId: String): NetworkResult<List<MessageDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.getMessages(token, conversationId)
                if (response.isSuccessful && response.body()?.success == true) {
                    val messages = response.body()?.data?.messages ?: emptyList()
                    NetworkResult.Success(messages.map { m ->
                        MessageDto(
                            id = m.id,
                            content = m.content,
                            senderId = m.senderId,
                            createdAt = try { Date(m.createdAt) } catch (_: Exception) { Date() },
                            senderName = m.senderName,
                            senderAvatar = m.senderAvatar,
                            isOwn = m.isOwn
                        )
                    })
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to load messages")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }

    suspend fun sendMessage(conversationId: String, content: String): NetworkResult<MessageDto> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.sendMessage(
                    token,
                    conversationId,
                    com.scholarme.core.data.model.AndroidSendMessageRequest(content)
                )
                if (response.isSuccessful && response.body()?.success == true) {
                    val m = response.body()!!.data!!
                    NetworkResult.Success(MessageDto(
                        id = m.id,
                        content = m.content,
                        senderId = tokenManager.getUserId() ?: "",
                        createdAt = try { Date(m.createdAt) } catch (_: Exception) { Date() },
                        senderName = tokenManager.getUserName() ?: "Me",
                        isOwn = true
                    ))
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to send message")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }
}

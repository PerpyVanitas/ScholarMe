package com.scholarme.features.messaging.data

import com.scholarme.features.messaging.data.model.*
import com.scholarme.features.messaging.data.remote.MessagingApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class MessagingRepository @Inject constructor(
    private val messagingApi: MessagingApi
) {
    suspend fun getConversations(): Result<List<ConversationDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = messagingApi.getConversations()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch conversations")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getMessages(conversationId: String): Result<List<MessageDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = messagingApi.getMessages(conversationId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch messages")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun sendMessage(conversationId: String, content: String): Result<MessageDto> {
        return withContext(Dispatchers.IO) {
            try {
                val response = messagingApi.sendMessage(conversationId, mapOf("content" to content))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to send message")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

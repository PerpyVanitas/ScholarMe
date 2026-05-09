package com.scholarme.features.messaging.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.messaging.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface MessagingApi {
    @GET("messaging/conversations")
    suspend fun getConversations(): Response<ApiResponse<List<ConversationDto>>>

    @GET("messaging/conversations/{id}/messages")
    suspend fun getMessages(@Path("id") conversationId: String): Response<ApiResponse<List<MessageDto>>>

    @POST("messaging/conversations/{id}/messages")
    suspend fun sendMessage(
        @Path("id") conversationId: String,
        @Body request: Map<String, String>
    ): Response<ApiResponse<MessageDto>>
}

package com.scholarme.features.messaging.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.messaging.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface MessagingApi {
    @GET("messages")
    suspend fun getConversations(): Response<ApiResponse<ConversationsResponse>>

    @GET("messages/{id}")
    suspend fun getMessages(@Path("id") conversationId: String): Response<ApiResponse<MessagesResponse>>

    @POST("messages/{id}")
    suspend fun sendMessage(
        @Path("id") conversationId: String,
        @Body request: Map<String, String>
    ): Response<ApiResponse<MessageDto>>
}

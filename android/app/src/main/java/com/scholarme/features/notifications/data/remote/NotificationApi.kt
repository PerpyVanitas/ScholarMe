package com.scholarme.features.notifications.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.notifications.data.model.NotificationDto
import retrofit2.Response
import retrofit2.http.GET

interface NotificationApi {
    @GET("notifications")
    suspend fun getNotifications(): Response<ApiResponse<List<NotificationDto>>>
}

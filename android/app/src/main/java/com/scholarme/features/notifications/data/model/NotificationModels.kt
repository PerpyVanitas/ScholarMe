package com.scholarme.features.notifications.data.model

data class NotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val type: String,
    val time: String,
    val read: Boolean
)

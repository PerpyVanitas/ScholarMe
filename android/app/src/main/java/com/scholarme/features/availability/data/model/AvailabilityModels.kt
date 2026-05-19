package com.scholarme.features.availability.data.model

import com.google.gson.annotations.SerializedName

data class TimeSlotDto(
    val id: String? = null,
    val day: String,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("isActive") val isActive: Boolean = true
)

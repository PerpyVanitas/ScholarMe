package com.scholarme.features.availability.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.availability.data.model.TimeSlotDto
import retrofit2.Response
import retrofit2.http.*

interface AvailabilityApi {
    @GET("availability")
    suspend fun getAvailability(): Response<ApiResponse<List<TimeSlotDto>>>

    @POST("availability")
    suspend fun updateAvailability(
        @Body slots: List<TimeSlotDto>
    ): Response<ApiResponse<Unit>>

    @PATCH("availability/status")
    suspend fun updateTutorStatus(
        @Body isAvailable: Map<String, Boolean>
    ): Response<ApiResponse<Unit>>
}

package com.scholarme.features.availability.data

import com.scholarme.features.availability.data.model.TimeSlotDto
import com.scholarme.features.availability.data.remote.AvailabilityApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class AvailabilityRepository @Inject constructor(
    private val availabilityApi: AvailabilityApi
) {
    suspend fun getAvailability(): Result<List<TimeSlotDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = availabilityApi.getAvailability()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch availability")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun updateAvailability(slots: List<TimeSlotDto>): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = availabilityApi.updateAvailability(slots)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to update availability")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun updateTutorStatus(isAvailable: Boolean): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = availabilityApi.updateTutorStatus(mapOf("isAvailable" to isAvailable))
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(Unit)
                } else {
                    Result.Error("Failed to update status")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

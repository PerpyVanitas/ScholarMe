package com.scholarme.features.timesheet.data

import com.google.gson.annotations.SerializedName
import com.scholarme.core.network.NetworkResult
import com.scholarme.features.timesheet.data.remote.TimesheetApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Date
import javax.inject.Inject

data class TimesheetEntryDto(
    val id: String,
    @SerializedName("tutor_id") val tutorId: String,
    @SerializedName("clock_in") val clockInTime: Date,
    @SerializedName("clock_out") val clockOutTime: Date?,
    @SerializedName("total_hours") val totalHours: Double?
)

class TimesheetRepository @Inject constructor(
    private val timesheetApi: TimesheetApi
) {
    
    suspend fun getActiveTimesheet(): NetworkResult<TimesheetEntryDto?> {
        return withContext(Dispatchers.IO) {
            try {
                val response = timesheetApi.getTimesheets()
                if (response.isSuccessful && response.body()?.success == true) {
                    val active = response.body()!!.data?.find { it.clockOutTime == null }
                    NetworkResult.Success(active)
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to fetch active timesheet")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getTimesheetHistory(): NetworkResult<List<TimesheetEntryDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = timesheetApi.getTimesheets()
                if (response.isSuccessful && response.body()?.success == true) {
                    val history = response.body()!!.data?.filter { it.clockOutTime != null } ?: emptyList()
                    NetworkResult.Success(history)
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to fetch timesheet history")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun clockIn(): NetworkResult<TimesheetEntryDto> {
        return withContext(Dispatchers.IO) {
            try {
                val response = timesheetApi.postTimesheetAction(mapOf("action" to "clock_in"))
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(response.body()!!.data!!)
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to clock in")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun clockOut(): NetworkResult<TimesheetEntryDto> {
        return withContext(Dispatchers.IO) {
            try {
                val response = timesheetApi.postTimesheetAction(mapOf("action" to "clock_out"))
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(response.body()!!.data!!)
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to clock out")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

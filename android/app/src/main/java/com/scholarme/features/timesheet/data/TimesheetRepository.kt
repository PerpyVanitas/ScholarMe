package com.scholarme.features.timesheet.data

import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.Date
import javax.inject.Inject

data class TimesheetEntryDto(
    val id: String,
    val tutorId: String,
    val clockInTime: Date,
    val clockOutTime: Date?,
    val totalHours: Double?
)

class TimesheetRepository @Inject constructor() {
    
    private var activeEntry: TimesheetEntryDto? = null
    private val history = mutableListOf<TimesheetEntryDto>()

    suspend fun getActiveTimesheet(): NetworkResult<TimesheetEntryDto?> {
        return withContext(Dispatchers.IO) {
            delay(400)
            NetworkResult.Success(activeEntry)
        }
    }

    suspend fun getTimesheetHistory(): NetworkResult<List<TimesheetEntryDto>> {
        return withContext(Dispatchers.IO) {
            delay(500)
            NetworkResult.Success(history.toList())
        }
    }

    suspend fun clockIn(): NetworkResult<TimesheetEntryDto> {
        return withContext(Dispatchers.IO) {
            delay(600)
            if (activeEntry != null) {
                NetworkResult.Error("Already clocked in")
            } else {
                val newEntry = TimesheetEntryDto(
                    id = System.currentTimeMillis().toString(),
                    tutorId = "current_tutor",
                    clockInTime = Date(),
                    clockOutTime = null,
                    totalHours = null
                )
                activeEntry = newEntry
                NetworkResult.Success(newEntry)
            }
        }
    }

    suspend fun clockOut(): NetworkResult<TimesheetEntryDto> {
        return withContext(Dispatchers.IO) {
            delay(600)
            val current = activeEntry
            if (current == null) {
                NetworkResult.Error("Not clocked in")
            } else {
                val outTime = Date()
                val diffHours = (outTime.time - current.clockInTime.time).toDouble() / (1000 * 60 * 60)
                
                val completed = current.copy(
                    clockOutTime = outTime,
                    totalHours = diffHours
                )
                history.add(0, completed)
                activeEntry = null
                NetworkResult.Success(completed)
            }
        }
    }
}

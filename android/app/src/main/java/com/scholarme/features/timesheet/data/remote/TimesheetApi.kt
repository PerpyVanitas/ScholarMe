package com.scholarme.features.timesheet.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.timesheet.data.TimesheetEntryDto
import retrofit2.Response
import retrofit2.http.*

interface TimesheetApi {
    @GET("android/timesheets")
    suspend fun getTimesheets(): Response<ApiResponse<List<TimesheetEntryDto>>>

    @POST("android/timesheets")
    suspend fun postTimesheetAction(
        @Body body: Map<String, String>
    ): Response<ApiResponse<TimesheetEntryDto>>
}

package com.scholarme.features.timesheet.ui

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.timesheet.data.TimesheetEntryDto
import com.scholarme.features.timesheet.data.TimesheetRepository
import com.scholarme.features.timesheet.data.remote.TimesheetApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import java.util.Date

@OptIn(ExperimentalCoroutinesApi::class)
class TimesheetViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()

    private class FakeTimesheetApi : TimesheetApi {
        var timesheetsResponse: Response<ApiResponse<List<TimesheetEntryDto>>>? = null
        var actionResponse: Response<ApiResponse<TimesheetEntryDto>>? = null

        override suspend fun getTimesheets(): Response<ApiResponse<List<TimesheetEntryDto>>> {
            return timesheetsResponse ?: Response.success(ApiResponse(success = true, data = emptyList()))
        }

        override suspend fun postTimesheetAction(body: Map<String, String>): Response<ApiResponse<TimesheetEntryDto>> {
            return actionResponse ?: throw IllegalStateException("Action not mocked")
        }
    }

    private lateinit var fakeApi: FakeTimesheetApi
    private lateinit var repository: TimesheetRepository
    private lateinit var viewModel: TimesheetViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeApi = FakeTimesheetApi()
        repository = TimesheetRepository(fakeApi)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadTimesheetData_success_updatesActiveAndHistory() = runBlocking {
        val activeEntry = TimesheetEntryDto(
            id = "1",
            tutorId = "tutor-1",
            clockInTime = Date(),
            clockOutTime = null,
            totalHours = null
        )
        val historyEntry = TimesheetEntryDto(
            id = "2",
            tutorId = "tutor-1",
            clockInTime = Date(),
            clockOutTime = Date(),
            totalHours = 2.0
        )

        fakeApi.timesheetsResponse = Response.success(
            ApiResponse(success = true, data = listOf(activeEntry, historyEntry))
        )

        viewModel = TimesheetViewModel(repository)
        
        // Wait for coroutine inside ViewModel init block to complete
        var attempts = 0
        while (viewModel.isLoading.value && attempts < 20) {
            delay(50)
            attempts++
        }

        assertEquals(activeEntry, viewModel.activeEntry.value)
        assertEquals(listOf(historyEntry), viewModel.history.value)
        assertFalse(viewModel.isLoading.value)
    }

    @Test
    fun toggleClockStatus_whenNoActiveEntry_clocksIn() = runBlocking {
        val newEntry = TimesheetEntryDto(
            id = "3",
            tutorId = "tutor-1",
            clockInTime = Date(),
            clockOutTime = null,
            totalHours = null
        )

        fakeApi.timesheetsResponse = Response.success(
            ApiResponse(success = true, data = emptyList())
        )
        fakeApi.actionResponse = Response.success(
            ApiResponse(success = true, data = newEntry)
        )

        viewModel = TimesheetViewModel(repository)
        
        // Wait for init load
        var attempts = 0
        while (viewModel.isLoading.value && attempts < 20) {
            delay(50)
            attempts++
        }

        assertNull(viewModel.activeEntry.value)

        viewModel.toggleClockStatus()
        
        // Wait for clock in to complete
        attempts = 0
        while (viewModel.isLoading.value && attempts < 20) {
            delay(50)
            attempts++
        }

        assertEquals(newEntry, viewModel.activeEntry.value)
        assertFalse(viewModel.isLoading.value)
    }
}

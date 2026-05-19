package com.scholarme.features.tutors.data

import com.scholarme.features.tutors.data.model.*
import com.scholarme.features.tutors.data.remote.TutorApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class TutorRepository @Inject constructor(
    private val tutorApi: TutorApi
) {
    suspend fun getTutors(
        page: Int = 1,
        limit: Int = 20,
        search: String? = null,
        specializationId: String? = null
    ): Result<TutorListResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = tutorApi.getTutors(page, limit, search, specializationId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to fetch tutors")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getTutor(tutorId: String): Result<TutorDto> {
        return withContext(Dispatchers.IO) {
            try {
                val response = tutorApi.getTutor(tutorId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()!!.data!!)
                } else {
                    Result.Error("Failed to fetch tutor details")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

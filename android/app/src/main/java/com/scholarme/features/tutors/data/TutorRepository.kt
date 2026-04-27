package com.scholarme.features.tutors.data

import com.scholarme.core.network.NetworkResult
import com.scholarme.core.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

// Placeholder DTO
data class TutorDto(val id: String, val name: String, val rating: Double)

class TutorRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getTutors(): NetworkResult<List<TutorDto>> {
        return withContext(Dispatchers.IO) {
            // Mock data for scaffolding
            NetworkResult.Success(listOf(
                TutorDto("1", "John Doe", 4.8),
                TutorDto("2", "Jane Smith", 4.9)
            ))
        }
    }
}

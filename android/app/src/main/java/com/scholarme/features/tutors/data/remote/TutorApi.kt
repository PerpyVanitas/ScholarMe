package com.scholarme.features.tutors.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.tutors.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface TutorApi {
    @GET("tutors")
    suspend fun getTutors(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("specialization") specializationId: String? = null
    ): Response<ApiResponse<TutorListResponse>>
    
    @GET("tutors/{id}")
    suspend fun getTutor(
        @Path("id") tutorId: String
    ): Response<ApiResponse<TutorDto>>
    
    @GET("tutors/{id}/availability")
    suspend fun getTutorAvailability(
        @Path("id") tutorId: String
    ): Response<ApiResponse<List<AvailabilityDto>>>
    
    @GET("specializations")
    suspend fun getSpecializations(): Response<ApiResponse<List<SpecializationDto>>>
}

package com.scholarme.features.flashcards.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.flashcards.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface FlashcardApi {
    @GET("api/flashcards")
    suspend fun getflashcards(): Response<ApiResponse<List<FlashcardDto>>>

    @GET("api/flashcards/{id}/questions")
    suspend fun getFlashcardQuestions(@Path("id") id: String): Response<ApiResponse<List<FlashcardQuestionDto>>>

    @GET("api/flashcards/{id}/study")
    suspend fun getStudySet(@Path("id") id: String): Response<ApiResponse<StudySetResponse>>

    @POST("api/flashcards/generate")
    suspend fun generateFlashcard(@Body request: GenerateFlashcardRequest): Response<ApiResponse<Any>>
}

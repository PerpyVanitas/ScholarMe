package com.scholarme.features.quizzes.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.features.quizzes.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface QuizApi {
    @GET("api/quizzes")
    suspend fun getQuizzes(): Response<ApiResponse<List<QuizDto>>>

    @GET("api/quizzes/{id}/questions")
    suspend fun getQuizQuestions(@Path("id") id: String): Response<ApiResponse<List<QuizQuestionDto>>>

    @GET("api/quizzes/{id}/study")
    suspend fun getStudySet(@Path("id") id: String): Response<ApiResponse<StudySetResponse>>

    @POST("api/quizzes/generate")
    suspend fun generateQuiz(@Body request: GenerateQuizRequest): Response<ApiResponse<Any>>
}

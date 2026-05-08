package com.scholarme.core.data.remote

import com.scholarme.core.data.model.ApiResponse
import com.scholarme.core.data.model.AndroidLoginRequest
import com.scholarme.core.data.model.AndroidLoginResponse
import com.scholarme.core.data.model.AndroidRegisterRequest
import com.scholarme.core.data.model.AndroidRegisterResponse
import com.scholarme.core.data.model.AndroidProfileResponse
import com.scholarme.core.data.model.AndroidDashboardStats
import com.scholarme.core.data.model.AndroidSessionDto
import com.scholarme.core.data.model.AndroidSessionsResponse
import com.scholarme.core.data.model.AndroidCreateSessionRequest
import com.scholarme.core.data.model.AndroidUpdateStatusRequest
import com.scholarme.core.data.model.AndroidTutorDto
import com.scholarme.core.data.model.AndroidTutorsResponse
import com.scholarme.core.data.model.AndroidConversationDto
import com.scholarme.core.data.model.AndroidConversationsResponse
import com.scholarme.core.data.model.AndroidMessageDto
import com.scholarme.core.data.model.AndroidMessagesResponse
import com.scholarme.core.data.model.AndroidSendMessageRequest
import com.scholarme.core.data.model.AndroidSendMessageResponse
import com.scholarme.core.data.model.AndroidCreateConversationRequest
import com.scholarme.core.data.model.AndroidPollDto
import com.scholarme.core.data.model.AndroidPollsResponse
import com.scholarme.core.data.model.AndroidVoteRequest
import com.scholarme.core.data.model.AndroidSpecializationsResponse
import com.scholarme.core.data.model.AndroidUpdateProfileRequest
import com.scholarme.core.data.model.ChangePasswordRequest
import com.scholarme.core.data.model.AndroidLeaderboardResponse
import com.scholarme.core.data.model.AndroidStudySetsResponse
import com.scholarme.core.data.model.AndroidQuizQuestionsResponse
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API Service interface.
 * All endpoints hit the Next.js API routes on Vercel under /api/android/.
 * Base URL: https://scholarme.vercel.app/api/android/
 */
interface ApiService {

    // ── Auth ─────────────────────────────────────────────────────────────────

    @POST("auth/login")
    suspend fun login(
        @Body request: AndroidLoginRequest
    ): Response<ApiResponse<AndroidLoginResponse>>

    @POST("auth/register")
    suspend fun register(
        @Body request: AndroidRegisterRequest
    ): Response<ApiResponse<AndroidRegisterResponse>>

    @GET("auth/profile")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<ApiResponse<AndroidProfileResponse>>

    @PUT("auth/update-profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: AndroidUpdateProfileRequest
    ): Response<ApiResponse<AndroidProfileResponse>>

    @POST("auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<ApiResponse<Map<String, String>>>

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GET("dashboard/stats")
    suspend fun getDashboardStats(
        @Header("Authorization") token: String
    ): Response<ApiResponse<AndroidDashboardStats>>

    // ── Sessions ──────────────────────────────────────────────────────────────

    @GET("sessions")
    suspend fun getSessions(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("status") status: String? = null
    ): Response<ApiResponse<AndroidSessionsResponse>>

    @POST("sessions")
    suspend fun createSession(
        @Header("Authorization") token: String,
        @Body request: AndroidCreateSessionRequest
    ): Response<ApiResponse<AndroidSessionDto>>

    @PUT("sessions/{id}/status")
    suspend fun updateSessionStatus(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String,
        @Body request: AndroidUpdateStatusRequest
    ): Response<ApiResponse<AndroidSessionDto>>

    // ── Tutors ────────────────────────────────────────────────────────────────

    @GET("tutors")
    suspend fun getTutors(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("specialization") specializationId: String? = null
    ): Response<ApiResponse<AndroidTutorsResponse>>

    @GET("tutors/{id}")
    suspend fun getTutor(
        @Path("id") tutorId: String
    ): Response<ApiResponse<AndroidTutorDto>>

    // ── Specializations ───────────────────────────────────────────────────────

    @GET("specializations")
    suspend fun getSpecializations(): Response<ApiResponse<AndroidSpecializationsResponse>>

    // ── Messages ──────────────────────────────────────────────────────────────

    @GET("messages")
    suspend fun getConversations(
        @Header("Authorization") token: String
    ): Response<ApiResponse<AndroidConversationsResponse>>

    @POST("messages")
    suspend fun createConversation(
        @Header("Authorization") token: String,
        @Body request: AndroidCreateConversationRequest
    ): Response<ApiResponse<Map<String, String>>>

    @GET("messages/{id}")
    suspend fun getMessages(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String,
        @Query("limit") limit: Int = 50
    ): Response<ApiResponse<AndroidMessagesResponse>>

    @POST("messages/{id}")
    suspend fun sendMessage(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String,
        @Body request: AndroidSendMessageRequest
    ): Response<ApiResponse<AndroidMessageDto>>

    // ── Polls ─────────────────────────────────────────────────────────────────

    @GET("polls")
    suspend fun getPolls(
        @Header("Authorization") token: String
    ): Response<ApiResponse<AndroidPollsResponse>>

    @POST("polls/{id}/vote")
    suspend fun castVote(
        @Header("Authorization") token: String,
        @Path("id") pollId: String,
        @Body request: AndroidVoteRequest
    ): Response<ApiResponse<Map<String, String>>>

    // ── Gamification ──────────────────────────────────────────────────────────

    @GET("gamification/leaderboard")
    suspend fun getLeaderboard(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 50
    ): Response<ApiResponse<AndroidLeaderboardResponse>>

    // ── Quizzes ───────────────────────────────────────────────────────────────

    @GET("quizzes")
    suspend fun getStudySets(
        @Header("Authorization") token: String,
        @Query("tab") tab: String = "my"
    ): Response<ApiResponse<AndroidStudySetsResponse>>

    @GET("quizzes/{id}/questions")
    suspend fun getQuizQuestions(
        @Header("Authorization") token: String,
        @Path("id") studySetId: String
    ): Response<ApiResponse<AndroidQuizQuestionsResponse>>
}

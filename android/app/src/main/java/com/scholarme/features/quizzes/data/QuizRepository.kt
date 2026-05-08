package com.scholarme.features.quizzes.data

import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.remote.ApiClient
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

data class QuizDto(
    val id: String,
    val title: String,
    val description: String,
    val questionCount: Int,
    val type: String = "flashcard",
    val isPublic: Boolean = false,
    val ownerName: String? = null,
    val createdAt: String? = null
)

data class QuizQuestionDto(
    val id: String,
    val questionText: String,
    val answer: String,
    val itemType: String,
    val options: List<String> = emptyList(),
    val correctAnswerIndex: Int = 0
)

class QuizRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    // Secondary constructor for non-Hilt usage
    constructor(tokenManager: TokenManager) : this(tokenManager, ApiClient.apiService)

    private fun getBearerToken(): String? {
        val token = tokenManager.getAccessToken()
        return if (token != null) "Bearer $token" else null
    }

    suspend fun getMyStudySets(): NetworkResult<List<QuizDto>> = getStudySets("my")

    suspend fun getSharedStudySets(): NetworkResult<List<QuizDto>> = getStudySets("shared")

    private suspend fun getStudySets(tab: String): NetworkResult<List<QuizDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.getStudySets(token, tab)
                if (response.isSuccessful && response.body()?.success == true) {
                    val sets = response.body()?.data?.studySets ?: emptyList()
                    NetworkResult.Success(sets.map { s ->
                        QuizDto(
                            id = s.id,
                            title = s.title,
                            description = s.description ?: "",
                            questionCount = s.questionCount,
                            type = s.type,
                            isPublic = s.isPublic,
                            ownerName = s.ownerName,
                            createdAt = s.createdAt
                        )
                    })
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to load study sets")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }

    suspend fun getQuizQuestions(studySetId: String): NetworkResult<List<QuizQuestionDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = getBearerToken()
                    ?: return@withContext NetworkResult.Error("Not authenticated")

                val response = apiService.getQuizQuestions(token, studySetId)
                if (response.isSuccessful && response.body()?.success == true) {
                    val questions = response.body()?.data?.questions ?: emptyList()
                    NetworkResult.Success(questions.map { q ->
                        QuizQuestionDto(
                            id = q.id,
                            questionText = q.questionText,
                            answer = q.answer,
                            itemType = q.itemType,
                            options = q.options,
                            correctAnswerIndex = q.correctAnswerIndex
                        )
                    })
                } else {
                    NetworkResult.Error(response.body()?.error?.message ?: "Failed to load questions")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.message ?: "Network error")
            }
        }
    }

    suspend fun submitQuizResult(studySetId: String, score: Int): NetworkResult<Unit> {
        // XP is awarded server-side via the xp_logs trigger. This is a no-op for now.
        return NetworkResult.Success(Unit)
    }
}

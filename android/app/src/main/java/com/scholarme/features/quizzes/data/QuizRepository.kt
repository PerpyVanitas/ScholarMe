package com.scholarme.features.quizzes.data

import com.scholarme.core.data.local.db.OfflineDao
import com.scholarme.core.data.local.db.StudyItemEntity
import com.scholarme.core.data.local.db.StudySetEntity
import com.scholarme.features.quizzes.data.model.*
import com.scholarme.features.quizzes.data.remote.QuizApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for Quiz and Study Mode operations.
 */
class QuizRepository @Inject constructor(
    private val quizApi: QuizApi,
    private val offlineDao: OfflineDao
) {
    
    suspend fun getQuizzes(): Result<List<QuizDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = quizApi.getQuizzes()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch quizzes")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getQuizQuestions(quizId: String): Result<List<QuizQuestionDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = quizApi.getQuizQuestions(quizId)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch questions")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getStudySet(id: String): Result<StudySetResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = quizApi.getStudySet(id)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        offlineDao.insertStudySet(StudySetEntity(data.id, data.title, data.description))
                        offlineDao.insertStudyItems(data.items.map { 
                            StudyItemEntity(setId = data.id, term = it.term, definition = it.definition) 
                        })
                        Result.Success(data)
                    } else {
                        Result.Error("Study set data is empty")
                    }
                } else {
                    val offlineItems = offlineDao.getItemsForSet(id)
                    if (offlineItems.isNotEmpty()) {
                         Result.Error("Offline mode: Loading cached data")
                    } else {
                        Result.Error("Failed to fetch study set and no offline copy found")
                    }
                }
            } catch (e: Exception) {
                val offlineItems = offlineDao.getItemsForSet(id)
                if (offlineItems.isNotEmpty()) {
                    Result.Error("Offline: Loading cached data")
                } else {
                    Result.Error(e.message ?: "Network error occurred")
                }
            }
        }
    }

    suspend fun generateQuiz(request: GenerateQuizRequest): Result<Boolean> {
        return withContext(Dispatchers.IO) {
            try {
                val response = quizApi.generateQuiz(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(true)
                } else {
                    Result.Error("Failed to generate quiz")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

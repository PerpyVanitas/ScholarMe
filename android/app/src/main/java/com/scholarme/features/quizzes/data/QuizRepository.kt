package com.scholarme.features.quizzes.data

import com.scholarme.core.data.local.db.OfflineDao
import com.scholarme.core.data.local.db.StudyItemEntity
import com.scholarme.core.data.local.db.StudySetEntity
import com.scholarme.core.data.model.*
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for Quiz and Study Mode operations.
 */
class QuizRepository @Inject constructor(
    private val apiService: ApiService,
    private val offlineDao: OfflineDao
) {
    
    suspend fun getQuizzes(): Result<List<QuizDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getQuizzes()
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
                val response = apiService.getQuizQuestions(quizId)
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
                val response = apiService.getStudySet(id)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        // Cache for offline use
                        offlineDao.insertStudySet(StudySetEntity(data.id, data.title, data.description))
                        offlineDao.insertStudyItems(data.items.map { 
                            StudyItemEntity(setId = data.id, term = it.term, definition = it.definition) 
                        })
                        Result.Success(data)
                    } else {
                        Result.Error("Study set data is empty")
                    }
                } else {
                    // Fallback to offline
                    val offlineItems = offlineDao.getItemsForSet(id)
                    if (offlineItems.isNotEmpty()) {
                         Result.Error("Offline mode: Loading cached data")
                    } else {
                        Result.Error("Failed to fetch study set and no offline copy found")
                    }
                }
            } catch (e: Exception) {
                // Network error, try offline
                val offlineItems = offlineDao.getItemsForSet(id)
                if (offlineItems.isNotEmpty()) {
                    Result.Error("Offline: Loading cached data")
                } else {
                    Result.Error(e.message ?: "Network error occurred")
                }
            }
        }
    }
}

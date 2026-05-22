package com.scholarme.features.flashcards.data

import com.scholarme.core.data.local.db.OfflineDao
import com.scholarme.core.data.local.db.StudyItemEntity
import com.scholarme.core.data.local.db.StudySetEntity
import com.scholarme.features.flashcards.data.model.*
import com.scholarme.features.flashcards.data.remote.FlashcardApi
import com.scholarme.core.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Repository for Flashcard and Study Mode operations.
 */
class FlashcardRepository @Inject constructor(
    private val FlashcardApi: FlashcardApi,
    private val offlineDao: OfflineDao
) {
    
    suspend fun getflashcards(): Result<List<FlashcardDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = FlashcardApi.getflashcards()
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(response.body()?.data ?: emptyList())
                } else {
                    Result.Error("Failed to fetch flashcards")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }

    suspend fun getFlashcardQuestions(FlashcardId: String): Result<List<FlashcardQuestionDto>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = FlashcardApi.getFlashcardQuestions(FlashcardId)
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
                val response = FlashcardApi.getStudySet(id)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        offlineDao.insertStudySet(StudySetEntity(data.id, data.title, data.description))
                        offlineDao.insertStudyItems(data.items.map { 
                            StudyItemEntity(setId = data.id, term = it.question, definition = it.answer) 
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

    suspend fun generateFlashcard(request: GenerateFlashcardRequest): Result<Boolean> {
        return withContext(Dispatchers.IO) {
            try {
                val response = FlashcardApi.generateFlashcard(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.Success(true)
                } else {
                    Result.Error("Failed to generate Flashcard")
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error occurred")
            }
        }
    }
}

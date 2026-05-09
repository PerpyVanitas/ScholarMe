package com.scholarme.features.quizzes.data

import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import javax.inject.Inject

data class QuizDto(
    val id: String,
    val title: String,
    val description: String,
    val questionCount: Int
)

data class QuizQuestionDto(
    val id: String,
    val questionText: String,
    val options: List<String>,
    val correctAnswerIndex: Int
)

class QuizRepository @Inject constructor() {
    
    // Mock data for functional UI
    private val mockQuizzes = listOf(
        QuizDto("1", "Advanced Calculus", "Test your knowledge on limits and derivatives.", 10),
        QuizDto("2", "World History", "A comprehensive review of the 20th century.", 15),
        QuizDto("3", "Organic Chemistry", "Carbon structures and reactions.", 20)
    )

    private val mockQuestions = listOf(
        QuizQuestionDto("q1", "What is the derivative of x^2?", listOf("x", "2x", "x^2", "2"), 1),
        QuizQuestionDto("q2", "What is the integral of 2x?", listOf("x^2", "x", "2x^2", "2"), 0)
    )

    suspend fun getQuizzes(): NetworkResult<List<QuizDto>> {
        return withContext(Dispatchers.IO) {
            delay(800) // Simulate network
            NetworkResult.Success(mockQuizzes)
        }
    }

    suspend fun getQuizQuestions(quizId: String): NetworkResult<List<QuizQuestionDto>> {
        return withContext(Dispatchers.IO) {
            delay(600) // Simulate network
            NetworkResult.Success(mockQuestions)
        }
    }

    suspend fun submitQuizResult(quizId: String, score: Int): NetworkResult<Unit> {
        return withContext(Dispatchers.IO) {
            delay(1000)
            NetworkResult.Success(Unit)
        }
    }
}

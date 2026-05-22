package com.scholarme.features.quizzes.data.model

data class StudySetItem(
    val id: String,
    val term: String,
    val definition: String
)

data class StudySetResponse(
    val id: String,
    val title: String,
    val description: String?,
    val items: List<StudySetItem>
)

data class QuizDto(
    val id: String,
    val title: String,
    val description: String?,
    val questionCount: Int
)

data class QuizQuestionDto(
    val id: String,
    val questionText: String,
    val options: List<String>,
    val correctAnswerIndex: Int
)

data class GenerateQuizRequest(
    val title: String,
    val topic: String,
    val description: String? = null,
    val type: String = "flashcard",
    val count: Int = 5,
    val is_public: Boolean = false
)

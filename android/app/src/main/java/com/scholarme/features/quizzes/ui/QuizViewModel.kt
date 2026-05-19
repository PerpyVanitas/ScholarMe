package com.scholarme.features.quizzes.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.quizzes.data.model.*
import com.scholarme.features.quizzes.data.QuizRepository
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class QuizViewModel @Inject constructor(
    private val repository: QuizRepository
) : ViewModel() {

    private val _quizzes = MutableStateFlow<List<QuizDto>>(emptyList())
    val quizzes: StateFlow<List<QuizDto>> = _quizzes.asStateFlow()

    private val _currentStudySet = MutableStateFlow<StudySetResponse?>(null)
    val currentStudySet: StateFlow<StudySetResponse?> = _currentStudySet.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadQuizzes()
    }

    fun loadQuizzes() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getQuizzes()) {
                is Result.Success -> {
                    _quizzes.value = result.data
                    _error.value = null
                }
                is Result.Error -> {
                    _error.value = result.message
                }
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun fetchStudySet(quizId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getStudySet(quizId)) {
                is Result.Success -> {
                    _currentStudySet.value = result.data
                    _error.value = null
                }
                is Result.Error -> {
                    _error.value = result.message
                }
                else -> {}
            }
            _isLoading.value = false
        }
    }
}

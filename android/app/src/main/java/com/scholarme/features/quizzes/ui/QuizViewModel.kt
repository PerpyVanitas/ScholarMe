package com.scholarme.features.quizzes.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.features.quizzes.data.QuizDto
import com.scholarme.features.quizzes.data.QuizRepository
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

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadQuizzes()
    }

    private fun loadQuizzes() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getQuizzes()) {
                is NetworkResult.Success -> {
                    _quizzes.value = result.data
                }
                else -> {
                    // Handle error state
                }
            }
            _isLoading.value = false
        }
    }
}

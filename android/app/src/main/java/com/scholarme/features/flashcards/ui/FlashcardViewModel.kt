package com.scholarme.features.flashcards.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.flashcards.data.model.*
import com.scholarme.features.flashcards.data.FlashcardRepository
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.scholarme.features.gamification.data.GamificationRepository

@HiltViewModel
class FlashcardViewModel @Inject constructor(
    private val repository: FlashcardRepository,
    private val gamificationRepository: GamificationRepository
) : ViewModel() {

    private val _flashcards = MutableStateFlow<List<FlashcardDto>>(emptyList())
    val flashcards: StateFlow<List<FlashcardDto>> = _flashcards.asStateFlow()

    private val _currentStudySet = MutableStateFlow<StudySetResponse?>(null)
    val currentStudySet: StateFlow<StudySetResponse?> = _currentStudySet.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadflashcards()
    }

    fun loadflashcards() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getflashcards()) {
                is Result.Success -> {
                    _flashcards.value = result.data
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

    fun fetchStudySet(FlashcardId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getStudySet(FlashcardId)) {
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

    fun generateFlashcard(request: GenerateFlashcardRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.generateFlashcard(request)) {
                is Result.Success -> {
                    _error.value = null
                    loadflashcards() // Refresh list
                    onSuccess()
                }
                is Result.Error -> {
                    _error.value = result.message
                }
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun finishFlashcards(onXpEarned: (Int) -> Unit) {
        viewModelScope.launch {
            // Reward 50 XP for finishing flashcards
            val result = gamificationRepository.awardXp(50, "Flashcard Study")
            if (result is Result.Success) {
                onXpEarned(result.data.xpEarned)
            }
        }
    }
}

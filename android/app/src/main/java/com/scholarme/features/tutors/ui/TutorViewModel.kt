package com.scholarme.features.tutors.ui

import androidx.lifecycle.viewModelScope
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.features.tutors.data.TutorDto
import com.scholarme.features.tutors.data.TutorRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TutorListState(
    val tutors: List<TutorDto> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class TutorViewModel @Inject constructor(
    private val repository: TutorRepository
) : BaseViewModel<TutorListState>() {

    override fun createInitialState() = TutorListState()

    init {
        loadTutors()
    }

    private fun loadTutors() {
        setLoading(true)
        viewModelScope.launch {
            when (val result = repository.getTutors()) {
                is NetworkResult.Success -> {
                    updateState { it.copy(tutors = result.data) }
                }
                is NetworkResult.Error -> {
                    updateState { it.copy(error = result.message) }
                }
                else -> {}
            }
            setLoading(false)
        }
    }
}

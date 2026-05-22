package com.scholarme.features.resources.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.resources.data.ResourceRepository
import com.scholarme.features.resources.data.model.*
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.scholarme.features.gamification.data.GamificationRepository

@HiltViewModel
class ResourceViewModel @Inject constructor(
    private val repository: ResourceRepository,
    private val gamificationRepository: GamificationRepository
) : ViewModel() {

    private val _repositories = MutableStateFlow<Result<List<RepositoryDto>>>(Result.Loading)
    val repositories: StateFlow<Result<List<RepositoryDto>>> = _repositories

    private val _files = MutableStateFlow<Result<List<ResourceDto>>>(Result.Loading)
    val files: StateFlow<Result<List<ResourceDto>>> = _files

    init {
        loadRepositories()
    }

    fun loadRepositories(search: String? = null) {
        viewModelScope.launch {
            _repositories.value = Result.Loading
            _repositories.value = repository.getRepositories(search)
        }
    }

    fun loadFiles(repositoryId: String) {
        viewModelScope.launch {
            _files.value = Result.Loading
            _files.value = repository.getRepositoryFiles(repositoryId)
        }
    }

    fun uploadResource(
        repositoryId: String,
        title: String,
        description: String?,
        fileBody: okhttp3.MultipartBody.Part,
        onXpEarned: (Int) -> Unit = {}
    ) {
        viewModelScope.launch {
            val result = repository.uploadResource(repositoryId, title, description, fileBody)
            if (result is Result.Success) {
                // Reload files for this repository to show the new upload
                loadFiles(repositoryId)
                // Reward 100 XP for uploading a resource
                val xpResult = gamificationRepository.awardXp(100, "Resource Upload")
                if (xpResult is Result.Success) {
                    onXpEarned(xpResult.data.xpEarned)
                }
            } else {
                // Provide a way to surface errors if needed (e.g., using a Channel for one-time UI events)
            }
        }
    }
}

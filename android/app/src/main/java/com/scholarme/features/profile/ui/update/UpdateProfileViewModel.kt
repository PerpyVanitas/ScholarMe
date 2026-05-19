package com.scholarme.features.profile.ui.update

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.profile.data.ProfileRepository
import com.scholarme.core.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UpdateProfileViewModel @Inject constructor(
    private val repository: ProfileRepository
) : ViewModel() {

    private val _updateResult = MutableStateFlow<Result<Unit>?>(null)
    val updateResult: StateFlow<Result<Unit>?> = _updateResult

    fun updateProfile(
        fullName: String,
        phone: String,
        bio: String,
        degreeProgram: String?,
        yearLevel: Int?,
        hourlyRate: Double? = null,
        yearsExperience: Int? = null
    ) {
        viewModelScope.launch {
            _updateResult.value = Result.Loading
            val result = repository.updateProfile(
                fullName,
                phone,
                bio,
                degreeProgram,
                yearLevel,
                hourlyRate,
                yearsExperience
            )
            _updateResult.value = when (result) {
                is Result.Success -> Result.Success(Unit)
                is Result.Error -> Result.Error(result.message)
                is Result.Loading -> Result.Loading
            }
        }
    }

    fun uploadAvatar(filePart: okhttp3.MultipartBody.Part) {
        viewModelScope.launch {
            _updateResult.value = Result.Loading
            val result = repository.uploadAvatar(filePart)
            _updateResult.value = when (result) {
                is Result.Success -> Result.Success(Unit)
                is Result.Error -> Result.Error(result.message)
                is Result.Loading -> Result.Loading
            }
        }
    }
}

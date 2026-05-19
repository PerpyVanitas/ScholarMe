package com.scholarme.features.profile.ui.change_password

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
class ChangePasswordViewModel @Inject constructor(
    private val repository: ProfileRepository
) : ViewModel() {

    private val _changeResult = MutableStateFlow<Result<Unit>?>(null)
    val changeResult: StateFlow<Result<Unit>?> = _changeResult

    fun changePassword(current: String, new: String) {
        viewModelScope.launch {
            _changeResult.value = Result.Loading
            val result = repository.changePassword(current, new)
            _changeResult.value = result
        }
    }
}

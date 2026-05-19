package com.scholarme.features.notifications.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.notifications.data.remote.NotificationApi
import com.scholarme.features.notifications.data.model.NotificationDto
import com.scholarme.core.util.Result
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import dagger.hilt.android.lifecycle.HiltViewModel

data class NotificationListState(
    val notifications: List<NotificationDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val notificationApi: NotificationApi
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(NotificationListState())
    val uiState: StateFlow<NotificationListState> = _uiState.asStateFlow()
    
    init {
        fetchNotifications()
    }
    
    fun fetchNotifications() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val response = notificationApi.getNotifications()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(
                        notifications = response.body()?.data ?: emptyList(),
                        isLoading = false,
                        error = null
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to fetch notifications"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Network error"
                )
            }
        }
    }
}

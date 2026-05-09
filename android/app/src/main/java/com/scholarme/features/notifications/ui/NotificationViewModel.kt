package com.scholarme.features.notifications.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.features.notifications.data.remote.NotificationApi
import com.scholarme.features.notifications.data.model.NotificationDto
import com.scholarme.core.util.Result
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import dagger.hilt.android.lifecycle.HiltViewModel

@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val notificationApi: NotificationApi
) : ViewModel() {
    
    private val _notifications = MutableStateFlow<Result<List<NotificationDto>>>(Result.Loading)
    val notifications: StateFlow<Result<List<NotificationDto>>> = _notifications
    
    init {
        fetchNotifications()
    }
    
    fun fetchNotifications() {
        viewModelScope.launch {
            _notifications.value = Result.Loading
            try {
                val response = notificationApi.getNotifications()
                if (response.isSuccessful && response.body()?.success == true) {
                    _notifications.value = Result.Success(response.body()?.data ?: emptyList())
                } else {
                    _notifications.value = Result.Error("Failed to fetch notifications")
                }
            } catch (e: Exception) {
                _notifications.value = Result.Error(e.message ?: "Network error")
            }
        }
    }
}

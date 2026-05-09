package com.scholarme.features.notifications.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.util.Result
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val type: String,
    val time: String,
    val read: Boolean
)

class NotificationViewModel @Inject constructor(
    private val apiService: ApiService
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
                val response = apiService.getNotifications()
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

package com.scholarme.core.presentation

import androidx.lifecycle.ViewModel
import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Base ViewModel providing StateFlow infrastructure for all features.
 *
 * Provides:
 * - Standard loading/error/success state management via StateFlow
 * - Error message management
 * - Navigation event handling
 * - Compose-ready architecture (no LiveData)
 *
 * Usage:
 * ```
 * class MyViewModel : BaseViewModel<MyState>() {
 *     override fun createInitialState() = MyState()
 *
 *     fun loadData() = launchOperation {
 *         val result = repository.getData()
 *         when (result) {
 *             is NetworkResult.Success -> updateState { it.copy(data = result.data) }
 *             is NetworkResult.Error -> setError(result.message)
 *             else -> {}
 *         }
 *     }
 * }
 * ```
 */
abstract class BaseViewModel<State> : ViewModel() {

    private val _state = MutableStateFlow(createInitialState())
    val state: StateFlow<State> = _state.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _navigationEvent = MutableStateFlow<NavigationEvent?>(null)
    val navigationEvent: StateFlow<NavigationEvent?> = _navigationEvent.asStateFlow()

    /**
     * Subclasses must implement to provide initial state.
     */
    abstract fun createInitialState(): State

    /**
     * Updates the state using a reducer function.
     * Thread-safe and can be called from any coroutine context.
     *
     * Usage: updateState { it.copy(data = newData) }
     */
    protected fun updateState(reducer: (State) -> State) {
        _state.update(reducer)
    }

    /**
     * Retrieves current state without collecting flow updates.
     * Use only for synchronous operations; prefer collecting from state flow.
     */
    protected fun getCurrentState(): State = _state.value

    /**
     * Sets the loading state.
     */
    protected fun setLoading(isLoading: Boolean) {
        _isLoading.value = isLoading
    }

    /**
     * Sets error message and clears after interaction.
     */
    protected fun setError(message: String?) {
        _errorMessage.value = message
    }

    /**
     * Clears error message.
     */
    protected fun clearError() {
        _errorMessage.value = null
    }

    /**
     * Emits a navigation event.
     */
    protected fun navigate(event: NavigationEvent) {
        _navigationEvent.value = event
    }

    /**
     * Clears navigation event after observing.
     */
    fun clearNavigationEvent() {
        _navigationEvent.value = null
    }

    /**
     * Handles loading state and error conversion for network results.
     */
    protected suspend fun <T> handleNetworkResult(
        result: NetworkResult<T>,
        onSuccess: suspend (T) -> Unit = {}
    ) {
        when (result) {
            is NetworkResult.Success -> {
                setLoading(false)
                clearError()
                onSuccess(result.data)
            }
            is NetworkResult.Error -> {
                setLoading(false)
                setError(result.message)
            }
            is NetworkResult.Unauthorized -> {
                setLoading(false)
                setError(result.message)
                navigate(NavigationEvent.NavigateToLogin)
            }
            is NetworkResult.Loading -> {
                setLoading(true)
            }
        }
    }
}

/**
 * Navigation events from ViewModel to UI.
 * Sealed class for type safety.
 */
sealed class NavigationEvent {
    object NavigateToLogin : NavigationEvent()
    data class NavigateToScreen(val route: String) : NavigationEvent()
    object NavigateBack : NavigationEvent()
    data class ShowError(val message: String) : NavigationEvent()
}
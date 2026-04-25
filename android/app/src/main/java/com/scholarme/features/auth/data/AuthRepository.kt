package com.scholarme.features.auth.data

import android.util.Log
import com.scholarme.core.auth.SessionValidator
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.data.model.*
import com.scholarme.core.data.remote.ApiService
import com.scholarme.core.error.ErrorHandler
import com.scholarme.core.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import com.scholarme.core.auth.LogoutHandler

/**
 * Authentication Repository (Vertical Slice - Auth Feature)
 *
 * Responsibilities:
 * - User login (email/password, card-based)
 * - User registration
 * - Logout and session cleanup
 * - Token refresh coordination
 * - Session state management
 *
 * All operations use NetworkResult for standardized state handling.
 * Operations support both Hilt injection and legacy factory patterns.
 */
class AuthRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val sessionValidator: SessionValidator,
    private val apiService: ApiService
) : LogoutHandler {

    companion object {
        private const val TAG = "AuthRepository"
    }

    /**
     * Legacy constructor — kept for backward compatibility only.
     * Prefer Hilt injection via the primary constructor.
     * NOTE: This path bypasses Hilt-configured OkHttpClient interceptors.
     */
    @Deprecated(
        message = "Use Hilt injection instead. This constructor bypasses auth/error interceptors.",
        replaceWith = ReplaceWith("Inject AuthRepository via Hilt")
    )
    constructor(tokenManager: TokenManager, apiService: ApiService) : this(
        tokenManager,
        SessionValidator(tokenManager),
        apiService
    )

    // =====================================================================
    // Login Operations
    // =====================================================================

    /**
     * Authenticates user with email and password.
     *
     * @param email User's email address
     * @param password User's password
     * @return NetworkResult.Success with UserProfile on success
     *         NetworkResult.Error with message on failure
     */
    suspend fun loginWithEmail(email: String, password: String): NetworkResult<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Attempting email login for: $email")
                
                val request = EmailLoginRequest(email, password)
                val response = apiService.login(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val loginResponse = response.body()?.data
                    if (loginResponse != null) {
                        // Persist token and user info
                        saveLoginSession(loginResponse)
                        Log.d(TAG, "Email login successful for: $email")
                        NetworkResult.Success(loginResponse.user)
                    } else {
                        NetworkResult.Error("Invalid response from server")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Login failed"
                    Log.w(TAG, "Login failed: $errorMsg")
                    NetworkResult.Error(errorMsg)
                }
            } catch (e: Exception) {
                val errorMsg = e.message ?: "Network error"
                Log.e(TAG, "Login exception: $errorMsg", e)
                ErrorHandler.handleException(e)
            }
        }
    }

    /**
     * Authenticates user with physical card credentials.
     *
     * @param cardId The card ID/number
     * @param pin The card PIN
     * @return NetworkResult.Success with UserProfile on success
     */
    suspend fun loginWithCard(cardId: String, pin: String): NetworkResult<UserProfile> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Attempting card login for card: ${maskCardId(cardId)}")
                
                val request = CardLoginRequest(cardId, pin)
                val response = apiService.cardLogin(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val loginResponse = response.body()?.data
                    if (loginResponse != null) {
                        saveLoginSession(loginResponse)
                        Log.d(TAG, "Card login successful")
                        NetworkResult.Success(loginResponse.user)
                    } else {
                        NetworkResult.Error("Invalid response from server")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Card login failed"
                    Log.w(TAG, "Card login failed: $errorMsg")
                    NetworkResult.Error(errorMsg)
                }
            } catch (e: Exception) {
                val errorMsg = e.message ?: "Network error"
                Log.e(TAG, "Card login exception: $errorMsg", e)
                ErrorHandler.handleException(e)
            }
        }
    }

    // Legacy method for backward compatibility
    @Deprecated("Use loginWithEmail instead", ReplaceWith("loginWithEmail(email, password)"))
    suspend fun login(email: String, password: String) = loginWithEmail(email, password)

    // =====================================================================
    // Registration
    // =====================================================================

    /**
     * Registers a new user account.
     * Automatically logs in user on success.
     *
     * @param email Email address (must be unique)
     * @param password Account password
     * @param fullName User's display name
     * @param role User role: "LEARNER" (default) or "TUTOR"
     * @return NetworkResult.Success with user ID on success
     */
    suspend fun register(
        email: String,
        password: String,
        fullName: String,
        role: String = "LEARNER"
    ): NetworkResult<String> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Registering new user: $email with role: $role")
                
                val request = RegisterRequest(email, password, fullName, role)
                val response = apiService.register(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val registerResponse = response.body()?.data
                    if (registerResponse != null) {
                        // Auto-login after registration
                        saveLoginSession(
                            LoginResponse(registerResponse.user, registerResponse.token)
                        )
                        Log.d(TAG, "Registration successful for: $email")
                        NetworkResult.Success(registerResponse.user.id)
                    } else {
                        NetworkResult.Error("Invalid response from server")
                    }
                } else {
                    val errorMsg = response.body()?.error?.message ?: "Registration failed"
                    Log.w(TAG, "Registration failed: $errorMsg")
                    NetworkResult.Error(errorMsg)
                }
            } catch (e: Exception) {
                val errorMsg = e.message ?: "Network error"
                Log.e(TAG, "Registration exception: $errorMsg", e)
                ErrorHandler.handleException(e)
            }
        }
    }

    // =====================================================================
    // Token Refresh
    // =====================================================================

    /**
     * Attempts to refresh the access token using refresh token.
     * Must be called when token is expired but refresh token is still valid.
     *
     * @return NetworkResult.Success with new UserProfile on success
     *         NetworkResult.Unauthorized if refresh fails
     */
    suspend fun refreshToken(): NetworkResult<UserProfile> {
        return withContext(Dispatchers.IO) {
            // Check if another thread is already refreshing
            if (tokenManager.isRefreshInProgress()) {
                return@withContext NetworkResult.Error("Token refresh already in progress")
            }

            // Acquire refresh lock
            if (!tokenManager.acquireRefreshLock()) {
                return@withContext NetworkResult.Error("Could not acquire refresh lock")
            }

            try {
                val refreshToken = tokenManager.getRefreshToken()
                if (refreshToken.isNullOrBlank()) {
                    Log.w(TAG, "No refresh token available")
                    tokenManager.clearTokens()
                    return@withContext NetworkResult.Unauthorized("Cannot refresh token")
                }

                Log.d(TAG, "Attempting token refresh")
                val request = RefreshTokenRequest(refreshToken)
                val response = apiService.refreshToken(request)

                if (response.isSuccessful && response.body()?.success == true) {
                    val loginResponse = response.body()?.data
                    if (loginResponse != null) {
                        // Save new tokens
                        saveLoginSession(loginResponse)
                        Log.d(TAG, "Token refresh successful")
                        NetworkResult.Success(loginResponse.user)
                    } else {
                        NetworkResult.Error("Invalid refresh response")
                    }
                } else {
                    Log.w(TAG, "Token refresh failed with status: ${response.code()}")
                    tokenManager.clearTokens()
                    NetworkResult.Unauthorized("Token refresh failed")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Token refresh exception", e)
                ErrorHandler.handleException(e)
            } finally {
                tokenManager.releaseRefreshLock()
            }
        }
    }

    // =====================================================================
    // Logout
    // =====================================================================

    /**
     * Logs out the current user and clears all session data.
     *
     * @return NetworkResult.Success on success (regardless of API response)
     *         NetworkResult.Error on network failure
     */
    override suspend fun logout(): NetworkResult<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val token = tokenManager.getAccessToken()
                if (!token.isNullOrBlank()) {
                    Log.d(TAG, "Logging out user")
                    val response = apiService.logout()
                    // Don't care about response, clear local session anyway
                }
            } catch (e: Exception) {
                Log.e(TAG, "Logout network error (non-critical)", e)
            } finally {
                // Always clear local session
                tokenManager.clearAll()
                Log.d(TAG, "User session cleared locally")
            }
            NetworkResult.Success(Unit)
        }
    }

    // =====================================================================
    // Session Validation
    // =====================================================================

    /**
     * Validates current session and returns status.
     */
    fun validateSession(): SessionValidator.SessionStatus {
        return sessionValidator.getSessionStatus()
    }

    /**
     * Checks if user is currently authenticated.
     */
    fun isUserLoggedIn(): Boolean {
        return sessionValidator.isUserAuthenticated()
    }

    /**
     * Gets current user ID if authenticated.
     */
    fun getCurrentUserId(): String? {
        return tokenManager.getUserId()
    }

    /**
     * Checks if session is still valid (not expired).
     */
    fun isSessionValid(): Boolean {
        return sessionValidator.isSessionValid()
    }

    // =====================================================================
    // Helper Methods
    // =====================================================================

    /**
     * Saves token and user info after successful authentication.
     */
    private fun saveLoginSession(loginResponse: LoginResponse) {
        val expiresInSeconds = 3600L // 1 hour, adjust based on backend
        tokenManager.saveAccessToken(loginResponse.token, expiresInSeconds)
        tokenManager.saveRefreshToken(loginResponse.token) // Backend should provide separate refresh token
        
        val user = loginResponse.user
        tokenManager.saveUserInfo(
            userId = user.id,
            email = user.email,
            fullName = user.fullName,
            role = user.role
        )
    }

    /**
     * Masks card ID for logging (shows only last 4 digits).
     */
    private fun maskCardId(cardId: String): String {
        return if (cardId.length > 4) {
            "*".repeat(cardId.length - 4) + cardId.takeLast(4)
        } else {
            cardId
        }
    }
}

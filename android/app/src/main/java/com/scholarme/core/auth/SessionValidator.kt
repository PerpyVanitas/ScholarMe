package com.scholarme.core.auth

import com.scholarme.core.data.local.TokenManager
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Validates user session state and token expiry.
 * Provides clear, testable session validation logic.
 *
 * Responsibilities:
 * - Check if user is authenticated
 * - Verify token expiry status
 * - Ensure session consistency
 * - Detect when token refresh is needed
 */
@Singleton
class SessionValidator @Inject constructor(
    private val tokenManager: TokenManager
) {

    /**
     * Validates complete session: token + user info + token not expired
     * @return true if session is valid and usable
     */
    fun isSessionValid(): Boolean {
        return isUserAuthenticated() && 
               isTokenValid() && 
               tokenManager.getUserId() != null
    }

    /**
     * Checks if user is logged in (has token and user ID).
     * Does not check expiry.
     */
    fun isUserAuthenticated(): Boolean {
        return tokenManager.isLoggedIn()
    }

    /**
     * Checks if access token is still valid and not expired.
     * Uses 5-minute buffer for proactive refresh.
     */
    fun isTokenValid(): Boolean {
        val token = tokenManager.getAccessToken() ?: return false
        return !tokenManager.isTokenExpired()
    }

    /**
     * Checks if token needs refresh (is expired or about to expire).
     */
    fun shouldRefreshToken(): Boolean {
        return tokenManager.isTokenExpired()
    }

    /**
     * Checks if user can attempt token refresh.
     */
    fun canRefreshToken(): Boolean {
        return tokenManager.canRefreshToken()
    }

    /**
     * Gets minutes remaining for token expiry.
     * Returns negative value if already expired.
     */
    fun getTokenExpiryMinutes(): Long {
        val expiresAt = tokenManager.getTokenExpiresAt()
        if (expiresAt <= 0) return -1
        return (expiresAt - System.currentTimeMillis()) / 60_000
    }

    /**
     * Validates session and returns detailed status.
     */
    fun getSessionStatus(): SessionStatus {
        return when {
            !isUserAuthenticated() -> SessionStatus.NOT_AUTHENTICATED
            !isTokenValid() -> SessionStatus.TOKEN_EXPIRED
            !tokenManager.canRefreshToken() -> SessionStatus.CANNOT_REFRESH
            else -> SessionStatus.VALID
        }
    }

    /**
     * Provides user identity if authenticated.
     */
    fun getCurrentUserId(): String? = tokenManager.getUserId()
    
    fun getCurrentUserEmail(): String? = tokenManager.getUserEmail()
    
    fun getCurrentUserRole(): String? = tokenManager.getUserRole()

    /**
     * Session status enum for clear state representation.
     */
    enum class SessionStatus {
        NOT_AUTHENTICATED, // No token or user info
        TOKEN_EXPIRED,      // Token has expired
        CANNOT_REFRESH,     // No refresh token available
        VALID               // Session is valid and usable
    }
}
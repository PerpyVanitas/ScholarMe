package com.scholarme.core.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.concurrent.atomic.AtomicLong

/**
 * Secure token storage and management using EncryptedSharedPreferences.
 *
 * Responsibilities:
 * - Secure JWT token storage (access + refresh tokens)
 * - User session information
 * - Token expiry tracking
 * - Thread-safe operations
 *
 * Token lifecycle:
 * 1. Access token: Short-lived (typically 15-60 min)
 * 2. Refresh token: Long-lived (typically 7-30 days)
 * 3. ExpiresAt: Unix timestamp when access token expires
 */
class TokenManager(context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "scholarme_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // Token refresh lock to prevent concurrent refresh attempts
    private val refreshLock = AtomicLong(0)
    
    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_TOKEN_EXPIRES_AT = "token_expires_at"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_ROLE = "user_role"
        
        @Volatile
        private var INSTANCE: TokenManager? = null
        
        fun getInstance(context: Context): TokenManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: TokenManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    // ============================================================
    // Token Operations
    // ============================================================
    
    /**
     * Saves access token and calculates expiry time.
     * @param token The JWT access token
     * @param expiresInSeconds Token validity duration in seconds
     */
    fun saveAccessToken(token: String, expiresInSeconds: Long = 3600) {
        prefs.edit().apply {
            putString(KEY_ACCESS_TOKEN, token)
            // Store expiry as Unix timestamp (3 seconds buffer for clock skew)
            val expiresAt = System.currentTimeMillis() + (expiresInSeconds * 1000) - 3000
            putLong(KEY_TOKEN_EXPIRES_AT, expiresAt)
            apply()
        }
    }
    
    /**
     * Retrieves the current access token.
     * @return JWT token or null if not set
     */
    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)
    
    /**
     * Saves the refresh token for token rotation.
     * @param token The long-lived refresh token
     */
    fun saveRefreshToken(token: String) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }
    
    /**
     * Retrieves the refresh token.
     * @return Refresh token or null if not set
     */
    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)
    
    /**
     * Checks if the access token is expired or about to expire.
     * Uses 5-minute buffer to refresh proactively.
     * @return true if token should be refreshed
     */
    fun isTokenExpired(): Boolean {
        val expiresAt = prefs.getLong(KEY_TOKEN_EXPIRES_AT, 0)
        // Buffer: refresh if within 5 minutes of expiry
        return System.currentTimeMillis() > (expiresAt - 300_000)
    }
    
    /**
     * Gets Unix timestamp when access token expires.
     * @return Expiry timestamp in milliseconds or 0 if not set
     */
    fun getTokenExpiresAt(): Long = prefs.getLong(KEY_TOKEN_EXPIRES_AT, 0)
    
    // ============================================================
    // User Information Operations
    // ============================================================
    
    /**
     * Saves complete user information after successful authentication.
     */
    fun saveUserInfo(userId: String, email: String, fullName: String, role: String) {
        prefs.edit().apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_NAME, fullName)
            putString(KEY_USER_ROLE, role)
            apply()
        }
    }
    
    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun getUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)
    fun getUserName(): String? = prefs.getString(KEY_USER_NAME, null)
    fun getUserRole(): String? = prefs.getString(KEY_USER_ROLE, null)
    
    // ============================================================
    // Session Checks
    // ============================================================
    
    /**
     * Determines if user is currently logged in.
     * @return true if access token exists and user credentials are stored
     */
    fun isLoggedIn(): Boolean {
        return getAccessToken() != null && getUserId() != null
    }
    
    /**
     * Determines if user can attempt token refresh.
     * @return true if refresh token exists
     */
    fun canRefreshToken(): Boolean = getRefreshToken() != null
    
    /**
     * Validates session consistency (token + user info both present).
     * @return true if session is valid
     */
    fun isSessionValid(): Boolean {
        val token = getAccessToken()
        val userId = getUserId()
        return token != null && userId != null && !isTokenExpired()
    }
    
    // ============================================================
    // Cleanup
    // ============================================================
    
    /**
     * Clears all stored tokens and user information.
     * Call on logout or authentication failure.
     */
    fun clearAll() {
        prefs.edit().clear().apply()
        refreshLock.set(0)
    }
    
    /**
     * Clears only tokens, preserving user info for recovery.
     */
    fun clearTokens() {
        prefs.edit().apply {
            remove(KEY_ACCESS_TOKEN)
            remove(KEY_REFRESH_TOKEN)
            remove(KEY_TOKEN_EXPIRES_AT)
            apply()
        }
    }
    
    // ============================================================
    // Token Refresh Coordination
    // ============================================================
    
    /**
     * Acquire lock for token refresh to prevent concurrent refresh attempts.
     * Returns true only if lock was acquired.
     */
    fun acquireRefreshLock(): Boolean {
        return refreshLock.compareAndSet(0, System.currentTimeMillis())
    }
    
    /**
     * Release the token refresh lock.
     */
    fun releaseRefreshLock() {
        refreshLock.set(0)
    }
    
    /**
     * Check if refresh lock is held and hasn't timed out (30 seconds).
     */
    fun isRefreshInProgress(): Boolean {
        val lockTime = refreshLock.get()
        if (lockTime == 0L) return false
        // Timeout refresh after 30 seconds
        return System.currentTimeMillis() - lockTime < 30_000
    }
}

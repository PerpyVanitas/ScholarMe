package com.scholarme.core.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure token storage using EncryptedSharedPreferences.
 * Handles Bearer token storage and retrieval for API authentication.
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
    
    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_EXPIRES_AT = "expires_at"

        
        @Volatile
        private var INSTANCE: TokenManager? = null
        
        fun getInstance(context: Context): TokenManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: TokenManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    // Token operations
    fun saveAccessToken(token: String) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }
    
    fun getAccessToken(): String? {
        return prefs.getString(KEY_ACCESS_TOKEN, null)
    }
    
    fun saveRefreshToken(token: String) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }
    
    fun getRefreshToken(): String? {
        return prefs.getString(KEY_REFRESH_TOKEN, null)
    }
    
    // User info operations
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
    
    fun isLoggedIn(): Boolean {
        return getAccessToken() != null
    }
    
    fun clearAll() {
        prefs.edit().clear().apply()
    }

    // New methods for session validation
    fun saveTokenExpiry(expiresInSeconds: Long) {
        val expiresAt = System.currentTimeMillis() + (expiresInSeconds * 1000)
        prefs.edit().putLong(KEY_EXPIRES_AT, expiresAt).apply()
    }

    fun getTokenExpiresAt(): Long = prefs.getLong(KEY_EXPIRES_AT, 0)

    fun isTokenExpired(): Boolean {
        val expiresAt = getTokenExpiresAt()
        if (expiresAt <= 0) return true
        // Buffer of 5 minutes to be safe
        return System.currentTimeMillis() > (expiresAt - 300_000)
    }

    fun canRefreshToken(): Boolean = getRefreshToken() != null

    fun getToken(): String? = getAccessToken()

}

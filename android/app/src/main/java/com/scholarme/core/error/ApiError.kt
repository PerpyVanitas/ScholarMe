package com.scholarme.core.error

import com.google.gson.annotations.SerializedName

/**
 * Data class representing an error response from the API.
 */
data class ApiError(
    @SerializedName("status")
    val status: Int? = null,
    
    @SerializedName("message")
    val message: String? = null,
    
    @SerializedName("error")
    val error: String? = null,
    
    @SerializedName("timestamp")
    val timestamp: String? = null,
    
    @SerializedName("path")
    val path: String? = null,
    
    @SerializedName("errors")
    val validationErrors: Map<String, String>? = null
) {
    /**
     * Returns a human-readable error message.
     */
    fun getDisplayMessage(): String {
        return message ?: error ?: "An unexpected error occurred"
    }
}

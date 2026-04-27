package com.scholarme.core.config

import com.scholarme.BuildConfig

/**
 * Application configuration management.
 * Supports multiple build flavors (dev, staging, production).
 *
 * Build flavors should be defined in build.gradle.kts:
 * ```
 * flavorDimensions += "environment"
 * productFlavors {
 *     create("dev") {
 *         dimension = "environment"
 *         buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/api/v1/\"")
 *         buildConfigField("String", "ENVIRONMENT", "\"development\"")
 *         buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "true")
 *     }
 *     create("staging") {
 *         dimension = "environment"
 *         buildConfigField("String", "API_BASE_URL", "\"https://staging-api.scholarme.app/api/v1/\"")
 *         buildConfigField("String", "ENVIRONMENT", "\"staging\"")
 *         buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "false")
 *     }
 *     create("production") {
 *         dimension = "environment"
 *         buildConfigField("String", "API_BASE_URL", "\"https://api.scholarme.app/api/v1/\"")
 *         buildConfigField("String", "ENVIRONMENT", "\"production\"")
 *         buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "false")
 *     }
 * }
 * ```
 */
object AppConfig {

    val apiBaseUrl: String = BuildConfig.API_BASE_URL
    val environment: String = BuildConfig.ENVIRONMENT
    val isDebug: Boolean = BuildConfig.DEBUG
    val enableNetworkLogging: Boolean = BuildConfig.ENABLE_NETWORK_LOGGING

    val isDevelopment: Boolean = environment == "development"
    val isStaging: Boolean = environment == "staging"
    val isProduction: Boolean = environment == "production"

    // Network timeouts (in seconds)
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L

    // Token configuration
    const val TOKEN_EXPIRY_BUFFER_SECONDS = 300L // Refresh 5 min before expiry
    const val TOKEN_REFRESH_MAX_RETRIES = 3

    // API configuration
    const val MAX_RETRIES = 3
    const val INITIAL_RETRY_DELAY_MS = 1000L

    // Logging configuration
    const val ENABLE_SENSITIVE_LOG_MASKING = true

    /**
     * Returns a user-friendly environment label.
     */
    fun getEnvironmentLabel(): String = when (environment) {
        "development" -> "Development (Local)"
        "staging" -> "Staging (Pre-prod)"
        "production" -> "Production"
        else -> environment
    }

    /**
     * Returns whether to allow insecure connections (dev only).
     */
    fun allowInsecureConnections(): Boolean = isDevelopment
}

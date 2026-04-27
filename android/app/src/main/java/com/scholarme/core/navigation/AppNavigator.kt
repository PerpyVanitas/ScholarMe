package com.scholarme.core.navigation

import android.content.Context

/**
 * Centralized navigation interface to decouple features.
 * Features should not reference each other's Activities directly.
 */
interface AppNavigator {
    fun navigateToLogin(context: Context)
    fun navigateToDashboard(context: Context)
    fun navigateToProfile(context: Context)
    fun navigateToUpdateProfile(context: Context)
    fun navigateToChangePassword(context: Context)
}

package com.scholarme.core.navigation

import android.content.Context
import android.content.Intent
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.ui.DashboardActivity
import com.scholarme.features.profile.ui.ProfileActivity
import com.scholarme.features.profile.ui.change_password.ChangePasswordActivity
import com.scholarme.features.profile.ui.update.UpdateProfileActivity
import javax.inject.Inject

/**
 * Implementation of AppNavigator using direct Intents.
 * This class knows about all features, but features only know about the AppNavigator interface.
 */
class AppNavigatorImpl @Inject constructor() : AppNavigator {
    override fun navigateToLogin(context: Context) {
        val intent = Intent(context, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        context.startActivity(intent)
    }

    override fun navigateToDashboard(context: Context) {
        val intent = Intent(context, DashboardActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        context.startActivity(intent)
    }

    override fun navigateToProfile(context: Context) {
        context.startActivity(Intent(context, ProfileActivity::class.java))
    }

    override fun navigateToUpdateProfile(context: Context) {
        context.startActivity(Intent(context, UpdateProfileActivity::class.java))
    }

    override fun navigateToChangePassword(context: Context) {
        context.startActivity(Intent(context, ChangePasswordActivity::class.java))
    }
}

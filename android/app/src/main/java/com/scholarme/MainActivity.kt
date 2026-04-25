package com.scholarme

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.scholarme.core.auth.SessionValidator
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.ui.DashboardActivity
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Main entry point activity.
 *
 * Improvements:
 * - @AndroidEntryPoint enables Hilt field injection
 * - SessionValidator injected via Hilt (single source of truth for auth state)
 * - isUserAuthenticated() used instead of TokenManager.getInstance() directly
 *   — keeps session check logic in the dedicated validator, not scattered
 */
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    @Inject
    lateinit var sessionValidator: SessionValidator

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val targetActivity = if (sessionValidator.isUserAuthenticated()) {
            DashboardActivity::class.java
        } else {
            LoginActivity::class.java
        }

        startActivity(Intent(this, targetActivity))
        finish()
    }
}

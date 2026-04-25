package com.scholarme

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.ui.DashboardActivity

/**
 * Main entry point activity.
 * Handles splash screen and navigation to the appropriate screen based on auth state.
 */
class MainActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen before super.onCreate()
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        // Check authentication state and navigate accordingly
        val tokenManager = TokenManager.getInstance(this)
        
        val targetActivity = if (tokenManager.isLoggedIn()) {
            DashboardActivity::class.java
        } else {
            LoginActivity::class.java
        }
        
        startActivity(Intent(this, targetActivity))
        finish()
    }
}

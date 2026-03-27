package com.scholarme.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.scholarme.app.data.AuthRepository
import com.scholarme.app.ui.auth.LoginActivity
import com.scholarme.app.ui.dashboard.DashboardActivity
import kotlinx.coroutines.launch

/**
 * Splash/Entry Activity - Determines if user is logged in
 * Routes to LoginActivity or DashboardActivity based on session state
 */
class MainActivity : AppCompatActivity() {

    private lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        authRepository = AuthRepository(this)
        
        lifecycleScope.launch {
            // Check if user has valid session token
            val hasValidSession = authRepository.hasValidToken()
            
            if (hasValidSession) {
                // User is logged in - navigate to dashboard
                navigateToDashboard()
            } else {
                // User is not logged in - navigate to login
                navigateToLogin()
            }
            
            // Close splash activity
            finish()
        }
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
    }

    private fun navigateToDashboard() {
        val intent = Intent(this, DashboardActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
    }
}

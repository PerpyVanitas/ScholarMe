package com.scholarme

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.navigation.AppNavHost
import com.scholarme.core.navigation.Screen
import com.scholarme.core.theme.ScholarMeTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Main entry point activity.
 * Handles the Single-Activity Architecture using Jetpack Compose Navigation.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        setContent {
            ScholarMeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    
                    // Determine start destination based on auth state
                    val startDestination = if (tokenManager.isLoggedIn()) {
                        Screen.Dashboard.route
                    } else {
                        // For now, if no login screen is ready in Compose, 
                        // we start at Dashboard or a placeholder.
                        // I will implement the LoginScreen next.
                        Screen.Dashboard.route 
                    }
                    
                    AppNavHost(
                        navController = navController,
                        startDestination = startDestination
                    )
                }
            }
        }
    }
}

package com.scholarme

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.scholarme.core.navigation.AppNavHost
import com.scholarme.core.theme.ScholarMeTheme

/**
 * Root Composable for the Jetpack Compose Android application.
 * Sets up the NavController and the global theme.
 */
@Composable
fun ScholarMeApp() {
    ScholarMeTheme {
        val navController = rememberNavController()
        
        Scaffold(
            modifier = Modifier.fillMaxSize()
        ) { paddingValues ->
            androidx.compose.foundation.layout.Box(
                modifier = Modifier.padding(paddingValues)
            ) {
                AppNavHost(navController = navController)
            }
        }
    }
}

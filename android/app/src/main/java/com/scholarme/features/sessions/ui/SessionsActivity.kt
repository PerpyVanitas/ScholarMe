package com.scholarme.features.sessions.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * SessionsActivity — entry point for sessions management.
 * Hosts the SessionManagementScreen Compose UI.
 */
@AndroidEntryPoint
class SessionsActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                SessionManagementScreen(
                    onBack = { finish() }
                )
            }
        }
    }
}

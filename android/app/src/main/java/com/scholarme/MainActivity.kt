package com.scholarme

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.fragment.app.FragmentActivity
import com.scholarme.core.data.local.TokenManager
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.ui.DashboardActivity

/**
 * Main entry point activity.
 * Handles splash screen, biometric verification, and navigation
 * to the appropriate screen based on auth state.
 */
class MainActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val tokenManager = TokenManager.getInstance(this)

        if (tokenManager.isLoggedIn()) {
            showBiometricPrompt()
        } else {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun showBiometricPrompt() {
        val biometricManager = BiometricManager.from(this)
        val authenticators = BiometricManager.Authenticators.BIOMETRIC_WEAK or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL

        when (biometricManager.canAuthenticate(authenticators)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                val executor = ContextCompat.getMainExecutor(this)
                val biometricPrompt = BiometricPrompt(this, executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                            super.onAuthenticationError(errorCode, errString)
                            Toast.makeText(applicationContext, "Authentication error: $errString", Toast.LENGTH_SHORT).show()
                            startActivity(Intent(this@MainActivity, LoginActivity::class.java))
                            finish()
                        }

                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(result)
                            startActivity(Intent(this@MainActivity, DashboardActivity::class.java))
                            finish()
                        }

                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                            Toast.makeText(applicationContext, "Authentication failed", Toast.LENGTH_SHORT).show()
                        }
                    })

                val promptInfo = BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Biometric login for ScholarMe")
                    .setSubtitle("Verify your identity to continue")
                    .setAllowedAuthenticators(authenticators)
                    .build()

                biometricPrompt.authenticate(promptInfo)
            }
            else -> {
                // No biometrics enrolled or hardware unavailable — proceed directly
                startActivity(Intent(this, DashboardActivity::class.java))
                finish()
            }
        }
    }
}

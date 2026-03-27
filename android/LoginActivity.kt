package com.scholarme.app.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.scholarme.app.R
import com.scholarme.app.AuthViewModel
import com.scholarme.app.ui.dashboard.DashboardActivity
import kotlinx.coroutines.launch

/**
 * Login Screen Activity
 * Handles user authentication with email and password
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var viewModel: AuthViewModel
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var registerButton: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Initialize ViewModel
        viewModel = ViewModelProvider(this).get(AuthViewModel::class.java)

        // Bind views
        emailInput = findViewById(R.id.emailInput)
        passwordInput = findViewById(R.id.passwordInput)
        loginButton = findViewById(R.id.loginButton)
        registerButton = findViewById(R.id.registerButton)
        progressBar = findViewById(R.id.progressBar)

        // Set up click listeners
        loginButton.setOnClickListener { handleLogin() }
        registerButton.setOnClickListener { navigateToRegister() }

        // Observe view model state
        observeViewModel()
    }

    private fun handleLogin() {
        val email = emailInput.text.toString().trim()
        val password = passwordInput.text.toString()

        // Validate inputs
        if (!validateInputs(email, password)) return

        // Show loading state
        showLoading(true)

        // Perform login
        lifecycleScope.launch {
            viewModel.login(email, password).collect { result ->
                result.onSuccess { response ->
                    showLoading(false)
                    Toast.makeText(this@LoginActivity, "Login successful", Toast.LENGTH_SHORT).show()
                    navigateToDashboard()
                }
                result.onFailure { exception ->
                    showLoading(false)
                    Toast.makeText(
                        this@LoginActivity,
                        "Login failed: ${exception.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun validateInputs(email: String, password: String): Boolean {
        if (email.isEmpty()) {
            emailInput.error = "Email is required"
            return false
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailInput.error = "Please enter a valid email"
            return false
        }

        if (password.isEmpty()) {
            passwordInput.error = "Password is required"
            return false
        }

        if (password.length < 6) {
            passwordInput.error = "Password must be at least 6 characters"
            return false
        }

        return true
    }

    private fun showLoading(isLoading: Boolean) {
        loginButton.isEnabled = !isLoading
        progressBar.visibility = if (isLoading) android.view.View.VISIBLE else android.view.View.GONE
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                when (state) {
                    is com.scholarme.app.data.UiState.Loading -> showLoading(true)
                    is com.scholarme.app.data.UiState.Success -> {
                        showLoading(false)
                        navigateToDashboard()
                    }
                    is com.scholarme.app.data.UiState.Error -> {
                        showLoading(false)
                        Toast.makeText(this@LoginActivity, state.message, Toast.LENGTH_LONG).show()
                    }
                    is com.scholarme.app.data.UiState.Idle -> showLoading(false)
                }
            }
        }
    }

    private fun navigateToRegister() {
        val intent = Intent(this, RegisterActivity::class.java)
        startActivity(intent)
    }

    private fun navigateToDashboard() {
        val intent = Intent(this, DashboardActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
    }
}

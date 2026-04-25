package com.scholarme.features.auth.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.snackbar.Snackbar
import com.scholarme.databinding.ActivityLoginBinding
import com.scholarme.features.auth.ui.register.RegisterActivity
import com.scholarme.features.dashboard.ui.DashboardActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * Login screen activity (Vertical Slice — Auth Feature).
 *
 * Fixes applied:
 * - @AndroidEntryPoint enables Hilt injection (eliminates LoginViewModelFactory)
 * - viewModels<LoginViewModel>() uses Hilt — no factory needed
 * - Correct method calls: loginWithEmail() / loginWithCard()
 * - StateFlow collected via lifecycleScope + repeatOnLifecycle(STARTED)
 *   (correct pattern — LiveData.observe() cannot collect StateFlow)
 */
@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    // Hilt injects LoginViewModel — no factory required
    private val viewModel: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        binding.btnLogin.setOnClickListener {
            // Populate form state then trigger login
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            viewModel.updateEmail(email)
            viewModel.updatePassword(password)
            viewModel.loginWithEmail()
        }

        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.tvForgotPassword.setOnClickListener {
            Snackbar.make(binding.root, "Password reset coming soon", Snackbar.LENGTH_SHORT).show()
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {

                // Observe loading + success state
                launch {
                    viewModel.state.collect { screenState ->
                        if (screenState.isSuccess) {
                            navigateToDashboard()
                        }
                    }
                }

                // Observe loading spinner
                launch {
                    viewModel.isLoading.collect { loading ->
                        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
                        binding.btnLogin.isEnabled = !loading
                    }
                }

                // Observe global error messages (e.g. network errors)
                launch {
                    viewModel.errorMessage.collect { error ->
                        if (!error.isNullOrBlank()) {
                            Snackbar.make(binding.root, error, Snackbar.LENGTH_LONG).show()
                        }
                    }
                }

                // Observe per-field form validation errors
                launch {
                    viewModel.formState.collect { form ->
                        binding.tilEmail.error = form.emailError
                        binding.tilPassword.error = form.passwordError
                    }
                }
            }
        }
    }

    private fun navigateToDashboard() {
        val intent = Intent(this, DashboardActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}

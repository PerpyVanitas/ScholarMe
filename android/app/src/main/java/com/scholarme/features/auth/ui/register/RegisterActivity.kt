package com.scholarme.features.auth.ui.register

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.snackbar.Snackbar
import com.scholarme.databinding.ActivityRegisterBinding
import com.scholarme.features.dashboard.ui.DashboardActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * Registration screen activity (Vertical Slice — Auth Feature).
 *
 * Migrated to @AndroidEntryPoint + Hilt ViewModel + StateFlow collectors.
 */
@AndroidEntryPoint
class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding

    private val viewModel: RegisterViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.btnRegister.setOnClickListener {
            val fullName = binding.etFullName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            val confirmPassword = binding.etConfirmPassword.text.toString()
            val role = when (binding.rgRole.checkedRadioButtonId) {
                binding.rbTutor.id -> "TUTOR"
                else -> "LEARNER"
            }
            viewModel.register(fullName, email, password, confirmPassword, role)
        }

        binding.tvLogin.setOnClickListener { finish() }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {

                launch {
                    viewModel.state.collect { state ->
                        if (state.isSuccess) {
                            Snackbar.make(
                                binding.root,
                                "Account created! Welcome to ScholarMe.",
                                Snackbar.LENGTH_SHORT
                            ).show()
                            // Navigate to dashboard on successful registration
                            val intent = Intent(this@RegisterActivity, DashboardActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            }
                            startActivity(intent)
                            finish()
                        }
                    }
                }

                launch {
                    viewModel.isLoading.collect { loading ->
                        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
                        binding.btnRegister.isEnabled = !loading
                    }
                }

                launch {
                    viewModel.errorMessage.collect { error ->
                        if (!error.isNullOrBlank()) {
                            Snackbar.make(binding.root, error, Snackbar.LENGTH_LONG).show()
                        }
                    }
                }

                launch {
                    viewModel.formState.collect { form ->
                        binding.tilFullName.error = form.fullNameError
                        binding.tilEmail.error = form.emailError
                        binding.tilPassword.error = form.passwordError
                        binding.tilConfirmPassword.error = form.confirmPasswordError
                    }
                }
            }
        }
    }
}

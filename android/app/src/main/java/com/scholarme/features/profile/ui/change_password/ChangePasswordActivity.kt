package com.scholarme.features.profile.ui.change_password

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.snackbar.Snackbar
import com.scholarme.databinding.ActivityChangePasswordBinding
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.core.presentation.NavigationEvent
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * Change password screen activity (Vertical Slice — Profile Feature).
 *
 * Migrated to @AndroidEntryPoint + Hilt ViewModel + StateFlow collectors.
 */
@AndroidEntryPoint
class ChangePasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChangePasswordBinding

    private val viewModel: ChangePasswordViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChangePasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.btnChangePassword.setOnClickListener {
            viewModel.changePassword(
                currentPassword = binding.etCurrentPassword.text.toString(),
                newPassword = binding.etNewPassword.text.toString(),
                confirmPassword = binding.etConfirmPassword.text.toString()
            )
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {

                launch {
                    viewModel.state.collect { state ->
                        if (state.isSuccess) {
                            Snackbar.make(binding.root, "Password changed successfully!", Snackbar.LENGTH_SHORT).show()
                            finish()
                        }
                    }
                }

                launch {
                    viewModel.isLoading.collect { loading ->
                        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
                        binding.btnChangePassword.isEnabled = !loading
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
                        binding.tilCurrentPassword.error = form.currentPasswordError
                        binding.tilNewPassword.error = form.newPasswordError
                        binding.tilConfirmPassword.error = form.confirmPasswordError
                    }
                }

                launch {
                    viewModel.navigationEvent.collect { event ->
                        if (event is NavigationEvent.NavigateToLogin) {
                            viewModel.clearNavigationEvent()
                            navigateToLogin()
                        }
                    }
                }
            }
        }
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}

package com.scholarme.features.profile.ui.update

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.snackbar.Snackbar
import com.scholarme.databinding.ActivityUpdateProfileBinding
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.core.presentation.NavigationEvent
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * Update profile screen activity (Vertical Slice — Profile Feature).
 *
 * Migrated to @AndroidEntryPoint + Hilt ViewModel + StateFlow collectors.
 */
@AndroidEntryPoint
class UpdateProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityUpdateProfileBinding

    private val viewModel: UpdateProfileViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUpdateProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.btnSave.setOnClickListener {
            viewModel.updateProfile(
                fullName = binding.etFullName.text.toString().trim(),
                phone = binding.etPhone.text.toString().trim().ifBlank { null },
                bio = binding.etBio.text.toString().trim().ifBlank { null }
            )
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {

                launch {
                    viewModel.state.collect { state ->
                        // Pre-fill form with current profile
                        state.currentProfile?.let { profile ->
                            binding.etFullName.setText(profile.fullName)
                            binding.etPhone.setText(profile.phone ?: "")
                            binding.etBio.setText(profile.bio ?: "")
                            binding.tilBio.visibility =
                                if (profile.role.lowercase() == "tutor") View.VISIBLE else View.GONE
                        }

                        if (state.isSuccess) {
                            Snackbar.make(binding.root, "Profile updated successfully!", Snackbar.LENGTH_SHORT).show()
                            finish()
                        }
                    }
                }

                launch {
                    viewModel.isLoading.collect { loading ->
                        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
                        binding.btnSave.isEnabled = !loading
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

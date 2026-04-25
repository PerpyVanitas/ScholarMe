package com.scholarme.features.profile.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.snackbar.Snackbar
import com.scholarme.databinding.ActivityProfileBinding
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.core.presentation.NavigationEvent
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

/**
 * Profile view screen activity (Vertical Slice — Profile Feature).
 *
 * Migrated to @AndroidEntryPoint + Hilt ViewModel + StateFlow collectors.
 */
@AndroidEntryPoint
class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding

    private val viewModel: ProfileViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener { finish() }
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadProfile() }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {

                launch {
                    viewModel.state.collect { state ->
                        state.profile?.let { profile ->
                            binding.progressBar.visibility = View.GONE
                            binding.profileContent.visibility = View.VISIBLE
                            binding.tvFullName.text = profile.fullName
                            binding.tvEmail.text = profile.email
                            binding.tvRole.text = profile.role.replaceFirstChar { it.uppercase() }
                            binding.tvPhone.text = profile.phone ?: "Not set"
                            binding.tvBio.text = profile.bio ?: "No bio provided"
                            binding.tutorSection.visibility =
                                if (profile.role.lowercase() == "tutor") {
                                    binding.tvRating.text = String.format("%.1f", profile.rating ?: 0.0)
                                    binding.tvTotalSessions.text = "${profile.totalSessions ?: 0} sessions"
                                    View.VISIBLE
                                } else View.GONE
                        }
                    }
                }

                launch {
                    viewModel.isLoading.collect { loading ->
                        binding.swipeRefresh.isRefreshing = loading
                        if (loading) {
                            binding.progressBar.visibility = View.VISIBLE
                            binding.profileContent.visibility = View.GONE
                        }
                    }
                }

                launch {
                    viewModel.errorMessage.collect { error ->
                        if (!error.isNullOrBlank()) {
                            binding.progressBar.visibility = View.GONE
                            binding.profileContent.visibility = View.GONE
                            Snackbar.make(binding.root, error, Snackbar.LENGTH_LONG).show()
                        }
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

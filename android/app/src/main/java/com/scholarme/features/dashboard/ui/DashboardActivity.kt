package com.scholarme.features.dashboard.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.scholarme.databinding.ActivityDashboardBinding
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.ui.adapter.SessionsAdapter
import com.scholarme.features.profile.ui.ProfileActivity
import com.scholarme.features.profile.ui.change_password.ChangePasswordActivity
import com.scholarme.features.profile.ui.update.UpdateProfileActivity
import com.scholarme.core.presentation.NavigationEvent
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Main dashboard screen activity (Vertical Slice — Dashboard Feature).
 *
 * Fixes applied:
 * - @AndroidEntryPoint enables Hilt for both ViewModel + AuthRepository injection
 * - viewModels<DashboardViewModel>() via Hilt — no factory needed
 * - Logout wrapped in lifecycleScope.launch { } — fixes suspend-in-non-suspend crash
 * - AuthRepository injected via @Inject — no manual instantiation across feature boundary
 * - LiveData observers replaced with StateFlow collectors (repeatOnLifecycle)
 * - Navigation events driven by BaseViewModel.navigationEvent
 */
@AndroidEntryPoint
class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var sessionsAdapter: SessionsAdapter

    // Hilt injects DashboardViewModel — no factory required
    private val viewModel: DashboardViewModel by viewModels()

    // Hilt injects AuthRepository for logout — eliminates cross-feature manual instantiation
    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
    }

    private fun setupUI() {
        // Setup RecyclerView
        sessionsAdapter = SessionsAdapter { session ->
            Snackbar.make(
                binding.root,
                "Session with ${session.tutorName ?: "tutor"} — ${session.status}",
                Snackbar.LENGTH_SHORT
            ).show()
        }
        binding.rvSessions.apply {
            layoutManager = LinearLayoutManager(this@DashboardActivity)
            adapter = sessionsAdapter
        }

        // Swipe to refresh
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.refresh()
        }

        // Navigation
        binding.btnProfile.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }
        binding.btnUpdateProfile.setOnClickListener {
            startActivity(Intent(this, UpdateProfileActivity::class.java))
        }
        binding.btnChangePassword.setOnClickListener {
            startActivity(Intent(this, ChangePasswordActivity::class.java))
        }

        // Logout — FIX: must be inside a coroutine (authRepository.logout is suspend)
        binding.btnLogout.setOnClickListener {
            lifecycleScope.launch {
                authRepository.logout()
                navigateToLogin()
            }
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {

                // Screen state — drives all UI
                launch {
                    viewModel.state.collect { screenState ->
                        renderState(screenState)
                    }
                }

                // Loading state — controls swipe refresh indicator
                launch {
                    viewModel.isLoading.collect { loading ->
                        binding.swipeRefresh.isRefreshing = loading
                        binding.statsProgressBar.visibility =
                            if (loading) View.VISIBLE else View.GONE
                    }
                }

                // Global error messages (stats/network failures)
                launch {
                    viewModel.errorMessage.collect { error ->
                        if (!error.isNullOrBlank()) {
                            Snackbar.make(binding.root, error, Snackbar.LENGTH_LONG).show()
                        }
                    }
                }

                // Navigation events from BaseViewModel (e.g. 401 → login)
                launch {
                    viewModel.navigationEvent.collect { event ->
                        when (event) {
                            is NavigationEvent.NavigateToLogin -> {
                                viewModel.clearNavigationEvent()
                                navigateToLogin()
                            }
                            else -> {}
                        }
                    }
                }
            }
        }
    }

    private fun renderState(state: DashboardScreenState) {
        // Header
        binding.tvWelcome.text = "Welcome, ${state.userName}!"
        binding.tvRole.text = state.userRole.replaceFirstChar { it.uppercase() }

        // Stats cards
        binding.statsProgressBar.visibility = View.GONE
        binding.tvTotalSessions.text = state.stats.totalSessions.toString()
        binding.tvUpcomingSessions.text = state.stats.upcomingSessions.toString()
        binding.tvCompletedSessions.text = state.stats.completedSessions.toString()
        binding.tvStudySets.text = state.stats.totalStudySets.toString()

        // Sessions list
        if (state.sessionsError != null) {
            binding.sessionsProgressBar.visibility = View.GONE
            binding.tvNoSessions.visibility = View.VISIBLE
            binding.rvSessions.visibility = View.GONE
        } else if (state.sessions.isEmpty()) {
            binding.sessionsProgressBar.visibility = View.GONE
            binding.tvNoSessions.visibility = View.VISIBLE
            binding.rvSessions.visibility = View.GONE
        } else {
            binding.sessionsProgressBar.visibility = View.GONE
            binding.tvNoSessions.visibility = View.GONE
            binding.rvSessions.visibility = View.VISIBLE
            sessionsAdapter.submitList(state.sessions)
        }
    }

    private fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    override fun onResume() {
        super.onResume()
        viewModel.refresh()
    }
}

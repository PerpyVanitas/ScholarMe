package com.scholarme.features.dashboard.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.scholarme.R
import com.scholarme.features.dashboard.ui.adapter.SessionsAdapter
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.util.Result
import com.scholarme.databinding.ActivityDashboardBinding
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.data.DashboardRepository
import com.scholarme.features.messaging.ui.MessagingActivity
import com.scholarme.features.profile.ui.ProfileActivity
import com.scholarme.features.profile.ui.change_password.ChangePasswordActivity
import com.scholarme.features.profile.ui.update.UpdateProfileActivity
import com.scholarme.features.sessions.ui.SessionsActivity

/**
 * Main dashboard screen activity.
 * Shows user stats, upcoming sessions, and quick actions.
 * Hosts the BottomNavigationView for all account types.
 */
class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var sessionsAdapter: SessionsAdapter

    private val viewModel: DashboardViewModel by viewModels {
        DashboardViewModelFactory(
            DashboardRepository(TokenManager.getInstance(this))
        )
    }

    private val authRepository by lazy {
        AuthRepository(TokenManager.getInstance(this))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupBottomNavigation()
        setupUI()
        observeViewModel()
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> {
                    // Already on dashboard — scroll to top
                    true
                }
                R.id.nav_messages -> {
                    startActivity(Intent(this, MessagingActivity::class.java))
                    true
                }
                R.id.nav_sessions -> {
                    startActivity(Intent(this, SessionsActivity::class.java))
                    true
                }
                R.id.nav_profile -> {
                    startActivity(Intent(this, ProfileActivity::class.java))
                    true
                }
                else -> false
            }
        }
        // Highlight the dashboard tab on start
        binding.bottomNavigation.selectedItemId = R.id.nav_dashboard
    }

    private fun setupUI() {
        // Setup RecyclerView for sessions
        sessionsAdapter = SessionsAdapter { session ->
            Snackbar.make(
                binding.root,
                "Session with ${session.tutorName ?: "tutor"} - ${session.status}",
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

        // Quick-action buttons
        binding.btnProfile.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }
        binding.btnUpdateProfile.setOnClickListener {
            startActivity(Intent(this, UpdateProfileActivity::class.java))
        }
        binding.btnChangePassword.setOnClickListener {
            startActivity(Intent(this, ChangePasswordActivity::class.java))
        }
        binding.btnLogout.setOnClickListener {
            authRepository.logout()
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }

    private fun observeViewModel() {
        viewModel.userName.observe(this) { name ->
            binding.tvWelcome.text = "Welcome, $name!"
        }

        viewModel.userRole.observe(this) { role ->
            binding.tvRole.text = role.replaceFirstChar { it.uppercase() }
        }

        viewModel.statsState.observe(this) { state ->
            binding.swipeRefresh.isRefreshing = false
            when (state) {
                is Result.Loading -> binding.statsProgressBar.visibility = View.VISIBLE
                is Result.Success -> {
                    binding.statsProgressBar.visibility = View.GONE
                    val stats = state.data
                    binding.tvTotalSessions.text = stats.totalSessions.toString()
                    binding.tvUpcomingSessions.text = stats.upcomingSessions.toString()
                    binding.tvCompletedSessions.text = stats.completedSessions.toString()
                    binding.tvStudySets.text = stats.totalStudySets.toString()
                }
                is Result.Error -> {
                    binding.statsProgressBar.visibility = View.GONE
                    binding.tvTotalSessions.text = "0"
                    binding.tvUpcomingSessions.text = "0"
                    binding.tvCompletedSessions.text = "0"
                    binding.tvStudySets.text = "0"
                }
            }
        }

        viewModel.sessionsState.observe(this) { state ->
            when (state) {
                is Result.Loading -> {
                    binding.sessionsProgressBar.visibility = View.VISIBLE
                    binding.tvNoSessions.visibility = View.GONE
                }
                is Result.Success -> {
                    binding.sessionsProgressBar.visibility = View.GONE
                    if (state.data.isEmpty()) {
                        binding.tvNoSessions.visibility = View.VISIBLE
                        binding.rvSessions.visibility = View.GONE
                    } else {
                        binding.tvNoSessions.visibility = View.GONE
                        binding.rvSessions.visibility = View.VISIBLE
                        sessionsAdapter.submitList(state.data)
                    }
                }
                is Result.Error -> {
                    binding.sessionsProgressBar.visibility = View.GONE
                    binding.tvNoSessions.visibility = View.VISIBLE
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Reset nav selection to dashboard when returning
        binding.bottomNavigation.selectedItemId = R.id.nav_dashboard
        viewModel.refresh()
    }
}

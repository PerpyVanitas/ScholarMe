package com.scholarme.features.dashboard.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.util.Result
import com.scholarme.databinding.ActivityDashboardBinding
import com.scholarme.features.auth.data.AuthRepository
import com.scholarme.features.auth.ui.login.LoginActivity
import com.scholarme.features.dashboard.data.DashboardRepository
import com.scholarme.features.profile.ui.ProfileActivity
import com.scholarme.features.profile.ui.change_password.ChangePasswordActivity
import com.scholarme.features.profile.ui.update.UpdateProfileActivity

/**
 * Main dashboard screen activity.
 * Shows user stats, upcoming sessions, and quick actions.
 */
class DashboardActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityDashboardBinding
    
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
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        // Swipe to refresh
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.refresh()
        }
        
        // Navigation buttons
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
                is Result.Loading -> {
                    binding.statsProgressBar.visibility = View.VISIBLE
                }
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
                    // Show default values
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
                    } else {
                        binding.tvNoSessions.visibility = View.GONE
                        // TODO: Set up RecyclerView adapter for sessions
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
        viewModel.refresh()
    }
}

package com.scholarme.features.profile.ui

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.util.Result
import com.scholarme.databinding.ActivityProfileBinding
import com.scholarme.features.profile.data.ProfileRepository

/**
 * Profile view screen activity.
 * Displays user profile information.
 */
class ProfileActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityProfileBinding
    
    private val viewModel: ProfileViewModel by viewModels {
        ProfileViewModelFactory(
            ProfileRepository(TokenManager.getInstance(this))
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadProfile()
        }
    }
    
    private fun observeViewModel() {
        viewModel.profileState.observe(this) { state ->
            binding.swipeRefresh.isRefreshing = false
            
            when (state) {
                is Result.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.profileContent.visibility = View.GONE
                }
                is Result.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.profileContent.visibility = View.VISIBLE
                    
                    val profile = state.data
                    binding.tvFullName.text = profile.fullName
                    binding.tvEmail.text = profile.email
                    binding.tvRole.text = profile.role.replaceFirstChar { it.uppercase() }
                    binding.tvPhone.text = profile.phoneNumber ?: "Not set"
                    binding.tvBio.text = profile.bio ?: "No bio provided"
                    
                    // Show tutor-specific info if applicable
                    if (profile.role == "tutor") {
                        binding.tutorSection.visibility = View.VISIBLE
                        binding.tvRating.text = String.format("%.1f", profile.rating ?: 0.0)
                        binding.tvExperience.text = "${profile.yearsExperience ?: 0} years"
                        binding.tvHourlyRate.text = "$${profile.hourlyRate ?: 0}/hr"
                    } else {
                        binding.tutorSection.visibility = View.GONE
                    }
                }
                is Result.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.profileContent.visibility = View.GONE
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }
    }
}

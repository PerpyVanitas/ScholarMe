package com.scholarme.features.profile.ui.update

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.util.Result
import com.scholarme.databinding.ActivityUpdateProfileBinding
import com.scholarme.features.profile.data.ProfileRepository

/**
 * Update profile screen activity.
 * Allows user to edit their profile information.
 */
class UpdateProfileActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityUpdateProfileBinding
    
    private val viewModel: UpdateProfileViewModel by viewModels {
        UpdateProfileViewModelFactory(
            ProfileRepository(TokenManager.getInstance(this))
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUpdateProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        binding.btnSave.setOnClickListener {
            val fullName = binding.etFullName.text.toString().trim()
            val phone = binding.etPhone.text.toString().trim().ifBlank { null }
            val bio = binding.etBio.text.toString().trim().ifBlank { null }
            
            viewModel.updateProfile(fullName, phone, bio)
        }
    }
    
    private fun observeViewModel() {
        // Load current profile to populate fields
        viewModel.currentProfile.observe(this) { state ->
            when (state) {
                is Result.Success -> {
                    binding.etFullName.setText(state.data.fullName)
                    binding.etPhone.setText(state.data.phone ?: "")
                    binding.etBio.setText(state.data.bio ?: "")
                    
                    // Show bio field only for tutors
                    binding.tilBio.visibility = if (state.data.role.lowercase() == "tutor") {
                        View.VISIBLE
                    } else {
                        View.GONE
                    }
                }
                else -> {}
            }
        }
        
        viewModel.updateState.observe(this) { state ->
            when (state) {
                is Result.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnSave.isEnabled = false
                }
                is Result.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnSave.isEnabled = true
                    Snackbar.make(binding.root, "Profile updated successfully!", Snackbar.LENGTH_SHORT).show()
                    finish()
                }
                is Result.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnSave.isEnabled = true
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_LONG).show()
                }
            }
        }
        
        viewModel.fullNameError.observe(this) { error ->
            binding.tilFullName.error = error
        }
    }
}

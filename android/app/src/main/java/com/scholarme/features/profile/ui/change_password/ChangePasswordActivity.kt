package com.scholarme.features.profile.ui.change_password

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.util.Result
import com.scholarme.databinding.ActivityChangePasswordBinding
import com.scholarme.features.profile.data.ProfileRepository

/**
 * Change password screen activity.
 * Allows user to change their password.
 */
class ChangePasswordActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityChangePasswordBinding
    
    private val viewModel: ChangePasswordViewModel by viewModels {
        ChangePasswordViewModelFactory(
            ProfileRepository(TokenManager.getInstance(this))
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChangePasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        binding.btnChangePassword.setOnClickListener {
            val currentPassword = binding.etCurrentPassword.text.toString()
            val newPassword = binding.etNewPassword.text.toString()
            val confirmPassword = binding.etConfirmPassword.text.toString()
            
            viewModel.changePassword(currentPassword, newPassword, confirmPassword)
        }
    }
    
    private fun observeViewModel() {
        viewModel.changePasswordState.observe(this) { state ->
            when (state) {
                is Result.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnChangePassword.isEnabled = false
                }
                is Result.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnChangePassword.isEnabled = true
                    Snackbar.make(binding.root, "Password changed successfully!", Snackbar.LENGTH_SHORT).show()
                    finish()
                }
                is Result.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnChangePassword.isEnabled = true
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_LONG).show()
                }
                null -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnChangePassword.isEnabled = true
                }
            }
        }
        
        viewModel.currentPasswordError.observe(this) { error ->
            binding.tilCurrentPassword.error = error
        }
        
        viewModel.newPasswordError.observe(this) { error ->
            binding.tilNewPassword.error = error
        }
        
        viewModel.confirmPasswordError.observe(this) { error ->
            binding.tilConfirmPassword.error = error
        }
    }
}

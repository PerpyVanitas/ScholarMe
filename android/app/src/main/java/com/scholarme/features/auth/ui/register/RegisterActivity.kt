package com.scholarme.features.auth.ui.register

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.scholarme.core.data.local.TokenManager
import com.scholarme.core.util.Result
import com.scholarme.databinding.ActivityRegisterBinding
import com.scholarme.features.auth.data.AuthRepository

/**
 * Registration screen activity.
 * Handles new user account creation.
 */
class RegisterActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityRegisterBinding
    
    private val viewModel: RegisterViewModel by viewModels {
        RegisterViewModelFactory(
            AuthRepository(TokenManager.getInstance(this))
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        binding.btnRegister.setOnClickListener {
            val fullName = binding.etFullName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            val confirmPassword = binding.etConfirmPassword.text.toString()
            
            // Get selected role
            val role = when (binding.rgRole.checkedRadioButtonId) {
                binding.rbTutor.id -> "tutor"
                else -> "learner"
            }
            
            viewModel.register(fullName, email, password, confirmPassword, role)
        }
        
        binding.tvLogin.setOnClickListener {
            finish()
        }
    }
    
    private fun observeViewModel() {
        viewModel.registerState.observe(this) { state ->
            when (state) {
                is Result.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnRegister.isEnabled = false
                }
                is Result.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnRegister.isEnabled = true
                    
                    Snackbar.make(
                        binding.root,
                        "Registration successful! Please check your email to verify your account.",
                        Snackbar.LENGTH_LONG
                    ).show()
                    
                    // Go back to login
                    finish()
                }
                is Result.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnRegister.isEnabled = true
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_LONG).show()
                }
                null -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnRegister.isEnabled = true
                }
            }
        }
        
        viewModel.fullNameError.observe(this) { error ->
            binding.tilFullName.error = error
        }
        
        viewModel.emailError.observe(this) { error ->
            binding.tilEmail.error = error
        }
        
        viewModel.passwordError.observe(this) { error ->
            binding.tilPassword.error = error
        }
        
        viewModel.confirmPasswordError.observe(this) { error ->
            binding.tilConfirmPassword.error = error
        }
    }
}

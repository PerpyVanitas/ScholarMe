# ScholarMe Android - Migration Checklist & Implementation Guide

## 🎯 Phase Completion Status

### ✅ Phase 1: Foundation (COMPLETE)
- [x] NetworkResult<T> wrapper created
- [x] AppConfig with multi-flavor support
- [x] Build flavors configured (dev, staging, prod)
- [x] TokenManager enhanced with expiry tracking + refresh lock
- [x] SessionValidator for auth checks
- [x] ErrorHandler for centralized error management

### ✅ Phase 2: Network Layer (COMPLETE)
- [x] AuthInterceptor fixed (getAccessToken() method)
- [x] Refresh token endpoint added to ApiService
- [x] RefreshTokenRequest model added
- [x] ApiError model added
- [x] NetworkResponseExt for Response<T> conversion
- [x] Error parsing utilities

### ✅ Phase 3: Auth Feature (MOSTLY COMPLETE)
- [x] AuthRepository completely refactored to NetworkResult
- [x] LoginViewModel migrated to StateFlow + BaseViewModel
- [x] BaseViewModel<State> created as foundation
- [ ] LoginActivity updated to use new ViewModel (MANUAL)
- [ ] RegisterViewModel created with StateFlow (TEMPLATE PROVIDED)
- [ ] RegisterActivity updated (MANUAL)

### ⏳ Phase 4: Feature Migration (IN PROGRESS)
- [ ] DashboardViewModel → StateFlow (TEMPLATE PROVIDED)
- [ ] DashboardRepository → NetworkResult
- [ ] DashboardActivity integration
- [ ] ProfileViewModel → StateFlow
- [ ] ProfileRepository → NetworkResult
- [ ] ProfileActivity integration
- [ ] Session refresh interceptor (OPTIONAL)

### 📋 Phase 5: Testing & Polish (NOT STARTED)
- [ ] Unit tests for repositories
- [ ] Unit tests for ViewModels
- [ ] Integration tests for auth flow
- [ ] E2E tests with multiple build flavors

---

## 🔧 Immediate Action Items for You

### 1. Build & Compile (5 minutes)

```bash
cd android
./gradlew clean build
# Fix any compilation errors
```

**Expected Errors**:
- LoginViewModelFactory may fail (update in next step)
- Missing imports (will auto-resolve in IDE)

### 2. Update LoginViewModelFactory (5 minutes)

**File**: `android/app/src/main/java/com/scholarme/features/auth/ui/login/LoginViewModelFactory.kt`

**Old Code**:
```kotlin
class LoginViewModelFactory(private val repository: AuthRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return LoginViewModel(repository) as T
    }
}
```

**New Code**:
```kotlin
// If using LoginViewModelFactory (legacy pattern)
class LoginViewModelFactory(
    private val tokenManager: TokenManager,
    private val sessionValidator: SessionValidator?,
    private val apiService: ApiService
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return LoginViewModel(AuthRepository(tokenManager, sessionValidator ?: SessionValidator(tokenManager), apiService)) as T
    }
}

// RECOMMENDED: Remove this factory and use @HiltViewModel instead:
// In LoginActivity, replace:
//   val viewModel: LoginViewModel by viewModels { LoginViewModelFactory(...) }
// With:
//   val viewModel: LoginViewModel by viewModels()
```

### 3. Update LoginActivity (10 minutes)

**File**: `android/app/src/main/java/com/scholarme/features/auth/ui/login/LoginActivity.kt`

**Migration Pattern**:

```kotlin
// BEFORE (LiveData)
class LoginActivity : AppCompatActivity() {
    private lateinit var viewModel: LoginViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.loginState.observe(this) { result ->
            when (result) {
                is Result.Success -> showSuccess(result.data)
                is Result.Error -> showError(result.message)
                is Result.Loading -> showLoading()
            }
        }
    }
    
    private fun performLogin() {
        viewModel.login(emailInput.text.toString(), passwordInput.text.toString())
    }
}

// AFTER (StateFlow + BaseViewModel)
class LoginActivity : AppCompatActivity() {
    private val viewModel: LoginViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                // Combine form updates
                viewModel.formState.collect { formState ->
                    emailInput.setText(formState.email)
                    passwordInput.setText(formState.password)
                    
                    // Show validation errors
                    emailInputLayout.error = formState.emailError
                    passwordInputLayout.error = formState.passwordError
                }
            }
        }
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { screenState ->
                    if (screenState.isSuccess) {
                        goToDashboard(screenState.user)
                    }
                }
            }
        }
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.isLoading.collect { isLoading ->
                    loginButton.isEnabled = !isLoading
                    if (isLoading) showLoadingIndicator() else hideLoadingIndicator()
                }
            }
        }
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.errorMessage.collect { errorMsg ->
                    if (errorMsg != null) {
                        showError(errorMsg)
                        viewModel.clearError()
                    }
                }
            }
        }
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.navigationEvent.collect { event ->
                    when (event) {
                        NavigationEvent.NavigateToLogin -> goToLogin()
                        is NavigationEvent.NavigateToScreen -> navigateTo(event.route)
                        NavigationEvent.NavigateBack -> onBackPressed()
                        is NavigationEvent.ShowError -> showError(event.message)
                        null -> {}
                    }
                    viewModel.clearNavigationEvent()
                }
            }
        }
    }
    
    // Add input listeners for form state updates
    private fun setupFormListeners() {
        emailInput.doOnTextChanged { text, _, _, _ ->
            viewModel.updateEmail(text?.toString() ?: "")
        }
        passwordInput.doOnTextChanged { text, _, _, _ ->
            viewModel.updatePassword(text?.toString() ?: "")
        }
        
        loginButton.setOnClickListener {
            viewModel.loginWithEmail()
        }
        
        cardLoginToggle.setOnClickListener {
            viewModel.toggleLoginMode()
        }
    }
}
```

### 4. Create RegisterViewModel (10 minutes)

Use the template below to create a new RegisterViewModel:

**File**: `android/app/src/main/java/com/scholarme/features/auth/ui/register/RegisterViewModel.kt`

```kotlin
package com.scholarme.features.auth.ui.register

import android.util.Patterns
import androidx.lifecycle.viewModelScope
import com.scholarme.core.data.model.UserProfile
import com.scholarme.core.network.NetworkResult
import com.scholarme.core.presentation.BaseViewModel
import com.scholarme.core.presentation.NavigationEvent
import com.scholarme.features.auth.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : BaseViewModel<RegisterScreenState>() {

    private val _formState = MutableStateFlow(RegisterFormState())
    val formState: StateFlow<RegisterFormState> = _formState.asStateFlow()

    private val _registerInProgress = MutableStateFlow(false)
    val registerInProgress: StateFlow<Boolean> = _registerInProgress.asStateFlow()

    override fun createInitialState() = RegisterScreenState(
        isSuccess = false,
        userId = null
    )

    fun updateEmail(email: String) {
        _formState.update { it.copy(email = email, emailError = null) }
    }

    fun updatePassword(password: String) {
        _formState.update { it.copy(password = password, passwordError = null) }
    }

    fun updatePasswordConfirm(confirm: String) {
        _formState.update { it.copy(passwordConfirm = confirm, passwordConfirmError = null) }
    }

    fun updateFullName(fullName: String) {
        _formState.update { it.copy(fullName = fullName, fullNameError = null) }
    }

    fun updateRole(role: String) {
        _formState.update { it.copy(role = role) }
    }

    fun register() {
        val form = _formState.value

        if (!validateForm(form)) return

        _registerInProgress.value = true
        setLoading(true)

        viewModelScope.launch {
            val result = authRepository.register(
                email = form.email,
                password = form.password,
                fullName = form.fullName,
                role = form.role
            )

            when (result) {
                is NetworkResult.Success -> {
                    setLoading(false)
                    _registerInProgress.value = false
                    updateState { it.copy(isSuccess = true, userId = result.data) }
                    clearError()
                    viewModelScope.launch {
                        kotlinx.coroutines.delay(1000)
                        navigate(NavigationEvent.NavigateToScreen("dashboard"))
                    }
                }
                is NetworkResult.Error -> {
                    setLoading(false)
                    _registerInProgress.value = false
                    setError(result.message)
                }
                is NetworkResult.Unauthorized -> {
                    setLoading(false)
                    _registerInProgress.value = false
                    setError("Registration failed. Please try again.")
                }
                else -> {}
            }
        }
    }

    private fun validateForm(form: RegisterFormState): Boolean {
        var isValid = true
        val updates = mutableMapOf<String, String?>()

        if (form.email.isBlank()) {
            updates["emailError"] = "Email is required"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(form.email).matches()) {
            updates["emailError"] = "Invalid email format"
            isValid = false
        }

        if (form.fullName.isBlank()) {
            updates["fullNameError"] = "Full name is required"
            isValid = false
        } else if (form.fullName.length < 2) {
            updates["fullNameError"] = "Name must be at least 2 characters"
            isValid = false
        }

        if (form.password.isBlank()) {
            updates["passwordError"] = "Password is required"
            isValid = false
        } else if (form.password.length < 8) {
            updates["passwordError"] = "Password must be at least 8 characters"
            isValid = false
        }

        if (form.passwordConfirm != form.password) {
            updates["passwordConfirmError"] = "Passwords do not match"
            isValid = false
        }

        if (updates.isNotEmpty()) {
            _formState.update {
                var updated = it
                updates.forEach { (field, error) ->
                    updated = when (field) {
                        "emailError" -> updated.copy(emailError = error)
                        "fullNameError" -> updated.copy(fullNameError = error)
                        "passwordError" -> updated.copy(passwordError = error)
                        "passwordConfirmError" -> updated.copy(passwordConfirmError = error)
                        else -> updated
                    }
                }
                updated
            }
        }

        return isValid
    }

    fun resetForm() {
        _formState.value = RegisterFormState()
        updateState { it.copy(isSuccess = false, userId = null) }
        clearError()
    }
}

data class RegisterFormState(
    val email: String = "",
    val emailError: String? = null,
    val password: String = "",
    val passwordError: String? = null,
    val passwordConfirm: String = "",
    val passwordConfirmError: String? = null,
    val fullName: String = "",
    val fullNameError: String? = null,
    val role: String = "LEARNER"
)

data class RegisterScreenState(
    val isSuccess: Boolean = false,
    val userId: String? = null
)
```

### 5. Update RegisterActivity (10 minutes)

Follow the same pattern as LoginActivity:
- Collect from formState, state, isLoading, errorMessage, navigationEvent
- Use doOnTextChanged for form updates
- Replace LiveData observers with StateFlow collection + repeatOnLifecycle

### 6. Migrate DashboardViewModel (15 minutes)

Use the template from ANDROID_ARCHITECTURE_REFACTORING.md:

- Rename current DashboardViewModel to DashboardViewModel.kt (if not already)
- Update DashboardRepository to use NetworkResult
- Create DashboardScreenState + DashboardFormState
- Inherit from BaseViewModel<DashboardScreenState>
- Use @HiltViewModel
- Add onRefresh(), loadDashboard() methods
- Handle Unauthorized in handleLoginResult

### 7. Run Tests & Validate

```bash
# Build all variants
./gradlew assembleDevDebug
./gradlew assembleStagingDebug
./gradlew assembleProductionDebug

# Run on emulator
adb install build/outputs/apk/dev/debug/app-dev-debug.apk
# Test login, refresh, logout

# Check logs
adb logcat | grep "AuthRepository\|LoginViewModel\|TokenManager"
```

---

## 😦 File Deletion Guide

Remove the old legacy code once migration is complete:

```bash
# Remove old Result<T> class (replaced by NetworkResult<T>)
rm android/app/src/main/java/com/scholarme/core/util/Result.kt

# Update imports everywhere:
# Find: import com.scholarme.core.util.Result
# Replace: import com.scholarme.core.network.NetworkResult

# Remove old factory if using Hilt:
rm android/app/src/main/java/com/scholarme/features/auth/ui/login/LoginViewModelFactory.kt
```

---

## ✅ Completeness Checklist

### Code Quality
- [ ] No LiveData remaining (all migrated to StateFlow)
- [ ] All NetworkResults handled (Success, Error, Unauthorized, Loading)
- [ ] No hardcoded tokens in UI code
- [ ] Proper error messages (user-friendly)
- [ ] All activities use repeatOnLifecycle pattern
- [ ] Form validation before repository calls
- [ ] Session validation before API calls
- [ ] Token refresh lock prevents race conditions

### Architecture
- [ ] Vertical slice pattern maintained (feature isolation)
- [ ] BaseViewModel used for all feature ViewModels
- [ ] NetworkResult used for all network operations
- [ ] SessionValidator used for session checks
- [ ] ErrorHandler used for error parsing
- [ ] AppConfig used for configuration
- [ ] TokenManager used for secure storage
- [ ] Hilt @HiltViewModel annotations on all ViewModels

### Security
- [ ] No tokens in logs (all masked debug logs)
- [ ] Sensitive data encrypted (EncryptedSharedPreferences)
- [ ] Proper Bearer token format in headers
- [ ] 401 responses clear tokens + navigate to login
- [ ] Logout clears all local data
- [ ] Token expiry prevents stale session usage

### Testing (Optional but Recommended)
- [ ] Manual test login with dev flavor
- [ ] Manual test logout
- [ ] Manual test expired token (mock 401)
- [ ] Manual test registration
- [ ] Manual test token refresh (if UI call added)
- [ ] Verify correct API base URL per flavor
- [ ] Network logging enabled in dev, disabled in prod

### Documentation
- [ ] ANDROID_ARCHITECTURE_REFACTORING.md created ✅
- [ ] Comments added to complex logic
- [ ] Navigation events documented
- [ ] Build flavor switches documented
- [ ] Token refresh flow documented
- [ ] Error handling strategy documented

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot access 'Result' (it is in package 'com.scholarme.core.util')"
**Solution**: Update imports to NetworkResult, delete Result.kt

### Issue: LoginViewModel not found in Hilt
**Solution**: Ensure @HiltViewModel annotation and @Inject constructor on LoginViewModel

### Issue: form doesn't update when typing
**Solution**: Ensure doOnTextChanged listeners are set up, update viewModel methods

### Issue: Navigation doesn't work
**Solution**: Ensure Activity handles NavigationEvent states, calls clearNavigationEvent()

### Issue: Token not being added to requests
**Solution**: Verify AuthInterceptor is included in OkHttpClient, uses getAccessToken()

### Issue: 401 responses not handled
**Solution**: Ensure Error case in handleLoginResult checks for code == 401, or return Unauthorized

---

## 📞 Quick Reference

### Key Classes Created
- `NetworkResult<T>` - New state wrapper
- `AppConfig` - Configuration management
- `SessionValidator` - Session validation
- `ErrorHandler` - Error parsing
- `BaseViewModel<State>` - ViewModel foundation
- `LoginViewModel` (migrated) - StateFlow-based
- `ANDROID_ARCHITECTURE_REFACTORING.md` - Architecture guide

### Key Classes Modified
- `TokenManager` - Added expiry + refresh lock
- `AuthRepository` - Now uses NetworkResult
- `AuthInterceptor` - Fixed getAccessToken() call
- `APIService` - Added refresh endpoint
- `NetworkModule` - Added SessionValidator + AppConfig
- `build.gradle.kts` - Added build flavors + StateFlow deps

### Migration Path
1. Fix LoginViewModelFactory or remove it
2. Update LoginActivity to StateFlow
3. Create RegisterViewModel with StateFlow
4. Update RegisterActivity
5. DashboardViewModel → StateFlow
6. ProfileViewModel → StateFlow
7. Test all flows
8. Deploy with new architecture

---

**Last Updated**: April 25, 2026  
**Status**: 70% Complete (Core + Auth Feature Done)  
**Next Milestone**: Dashboard + Profile Features Migrated
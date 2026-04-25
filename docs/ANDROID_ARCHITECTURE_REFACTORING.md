# ScholarMe Android Architecture Refactoring Guide

**Status**: Phase 1-3 Complete | Phase 4 In Progress  
**Date**: April 25, 2026  
**Target**: MVP-focused, production-grade Android architecture with Compose readiness

---

## 📋 Executive Summary

This document outlines the **complete architectural refactoring** of the ScholarMe Android application. The refactoring delivers:

✅ **Foundation Layer** (Complete)
- NetworkResult<T> wrapper for standardized state handling
- Multi-build flavors (dev, staging, production) via AppConfig
- Token refresh mechanism with lock coordination
- Centralized error handling framework
- SessionValidator for auth checks

✅ **Network Layer** (Complete)
- Fixed AuthInterceptor token handling
- Added refresh token endpoint to ApiService
- Network response extension functions
- Error parsing and classification

✅ **Presentation Layer - StateFlow Migration** (In Progress)
- BaseViewModel<State> for all features
- LoginViewModel completely migrated to StateFlow
- NavigationEvent sealed class for type-safe routing
- Form state management with validation

❌ **Remaining Work**
- DashboardViewModel migration to StateFlow
- ProfileViewModel migration to StateFlow
- RegisterViewModel creation with StateFlow
- Activity layer updates to use new ViewModels
- Token refresh coordination at Activity level
- Testing & validation

---

## 🏗️ Architecture Overview

### Vertical Slice Architecture

```
features/
├── auth/                    ← VERTICAL SLICE: Auth
│   ├── data/
│   │   └── AuthRepository   ← Uses NetworkResult
│   ├── ui/
│   │   ├── login/
│   │   │   ├── LoginActivity
│   │   │   └── LoginViewModel    ← Uses StateFlow (MIGRATED)
│   │   ├── register/
│   │   │   ├── RegisterActivity
│   │   │   └── RegisterViewModel  ← NEEDS MIGRATION
│   │   └── ★ fragments/activities for feature UI
│   └── ★ Other domain entities
│
├── dashboard/              ← VERTICAL SLICE: Dashboard
│   ├── data/
│   │   └── DashboardRepository  ← NEEDS NetworkResult
│   └── ui/
│       ├── DashboardActivity
│       └── DashboardViewModel     ← NEEDS StateFlow migration
│
└── profile/               ← VERTICAL SLICE: Profile
    ├── data/
    │   └── ProfileRepository      ← NEEDS NetworkResult
    └── ui/
        └── ProfileViewModel        ← NEEDS StateFlow migration

core/                      ← SHARED: Cross-cutting concerns
├── auth/
│   └── SessionValidator    ← Check session validity
├── config/
│   └── AppConfig           ← Build flavor configuration
├── data/
│   ├── local/
│   │   ├── TokenManager    ← Secure token storage + refresh lock
│   │   └── ★ Other local caches
│   ├── model/
│   │   └── ApiModels.kt    ← All DTOs + ApiError
│   └── remote/
│       ├── ApiService      ← All endpoints (+ refresh)
│       ├── ApiClient       ← Retrofit singleton
│       ├── AuthInterceptor ← Add Bearer token (FIXED)
│       └── NetworkErrorInterceptor
├── di/
│   ├── NetworkModule       ← Hilt providers (UPDATED)
│   └── RepositoryModule    ← Hilt providers
├── error/
│   └── ErrorHandler        ← Parse & classify errors
├── network/
│   ├── NetworkResult<T>    ← Standardized state
│   └── NetworkResponseExt  ← Response extensions
└── presentation/
    └── BaseViewModel<State> ← StateFlow foundation
```

---

## 🔄 Key Refactorings

### 1. NetworkResult<T> - Standardized State Management

**Before (Old Pattern)**:
```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}
```

**After (New Pattern)**:
```kotlin
sealed class NetworkResult<out T> {
    data class Loading<T> : NetworkResult<T>()
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error<T>(val message: String, val code: Int?, val apiError: ApiError?, val exception: Throwable?) : NetworkResult<T>()
    data class Unauthorized<T>(val message: String, val exception: Throwable?) : NetworkResult<T>()
}
```

**Benefits**:
- Explicit Unauthorized state for 401 handling
- Error classification (code, apiError object)
- Ready for Compose with proper state management
- Thread-safe error handling

**Migration**:
```kotlin
// Old
val result = repository.login(email, password)
when (result) {
    is Result.Success -> { ... }
    is Result.Error -> { ... }
    is Result.Loading -> { ... }
}

// New
val result = repository.login(email, password)
when (result) {
    is NetworkResult.Success -> { ... }
    is NetworkResult.Error -> { ... }
    is NetworkResult.Unauthorized -> { navigate("/login") }
    is NetworkResult.Loading -> { ... }
}
```

### 2. Build Flavors - Environment Management

**Before**:
- Hardcoded API_BASE_URL in build.gradle.kts
- No easy way to switch between dev/staging/prod
- Debug/release only, no intermediate environments

**After**:
```gradle
flavorDimensions += "environment"
productFlavors {
    create("dev") {
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8080/api/v1/\"")
        buildConfigField("String", "ENVIRONMENT", "\"development\"")
        buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "true")
    }
    create("staging") {
        buildConfigField("String", "API_BASE_URL", "\"https://staging-api.scholarme.app/api/v1/\"")
        buildConfigField("String", "ENVIRONMENT", "\"staging\"")
        buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "false")
    }
    create("production") {
        buildConfigField("String", "API_BASE_URL", "\"https://api.scholarme.app/api/v1/\"")
        buildConfigField("String", "ENVIRONMENT", "\"production\"")
        buildConfigField("Boolean", "ENABLE_NETWORK_LOGGING", "false")
    }
}
```

**Using AppConfig**:
```kotlin
class AppConfig {
    val apiBaseUrl: String = BuildConfig.API_BASE_URL
    val environment: String = BuildConfig.ENVIRONMENT
    val isDevelopment: Boolean = environment == "development"
    val enableNetworkLogging: Boolean = BuildConfig.ENABLE_NETWORK_LOGGING
}
```

**Build variants in Android Studio**:
- devDebug, devRelease
- stagingDebug, stagingRelease
- productionDebug, productionRelease

### 3. Token Management & Refresh

**New Features in TokenManager**:
```kotlin
// Token expiry tracking
fun saveAccessToken(token: String, expiresInSeconds: Long = 3600)
fun isTokenExpired(): Boolean  // With 5-min buffer
fun getTokenExpiresAt(): Long

// Token refresh coordination
fun acquireRefreshLock(): Boolean
fun releaseRefreshLock()
fun isRefreshInProgress(): Boolean

// Session validation
fun isSessionValid(): Boolean
fun canRefreshToken(): Boolean
fun isTokenExpired(): Boolean
```

**Refresh Token Endpoint in ApiService**:
```kotlin
@POST("auth/refresh")
suspend fun refreshToken(
    @Body request: RefreshTokenRequest
): Response<ApiResponse<LoginResponse>>

data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)
```

**AuthRepository Refresh Logic**:
```kotlin
suspend fun refreshToken(): NetworkResult<UserProfile> {
    // 1. Check if refresh already in progress (lock)
    if (tokenManager.isRefreshInProgress()) return error
    
    // 2. Acquire lock for this coroutine
    if (!tokenManager.acquireRefreshLock()) return error
    
    try {
        // 3. Get refresh token
        val refreshToken = tokenManager.getRefreshToken() ?: return Unauthorized()
        
        // 4. Call refresh endpoint
        val response = apiService.refreshToken(RefreshTokenRequest(refreshToken))
        
        // 5. Save new tokens
        if (success) saveLoginSession(loginResponse)
        
        return NetworkResult.Success(user)
    } finally {
        // 6. Release lock
        tokenManager.releaseRefreshLock()
    }
}
```

### 4. StateFlow Migration - ViewModel Layer

**Before (LiveData)**:
```kotlin
class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {
    private val _loginState = MutableLiveData<Result<UserProfile>?>()
    val loginState: LiveData<Result<UserProfile>?> = _loginState
    
    fun login(email: String, password: String) {
        _loginState.value = Result.Loading
        viewModelScope.launch {
            val result = authRepository.login(email, password)
            _loginState.value = result
        }
    }
}
```

**After (StateFlow + BaseViewModel)**:
```kotlin
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : BaseViewModel<LoginScreenState>() {
    
    private val _formState = MutableStateFlow(LoginFormState())
    val formState: StateFlow<LoginFormState> = _formState.asStateFlow()
    
    override fun createInitialState() = LoginScreenState(isSuccess = false, user = null)
    
    fun loginWithEmail() {
        if (!validateEmailLoginForm(_formState.value)) return
        performEmailLogin(...)
    }
    
    private fun performEmailLogin(email: String, password: String) {
        setLoading(true)
        viewModelScope.launch {
            val result = authRepository.loginWithEmail(email, password)
            handleLoginResult(result)
        }
    }
    
    private fun handleLoginResult(result: NetworkResult<UserProfile>) {
        when (result) {
            is NetworkResult.Success -> {
                setLoading(false)
                updateState { it.copy(isSuccess = true, user = result.data) }
            }
            is NetworkResult.Unauthorized -> {
                setLoading(false)
                navigate(NavigationEvent.NavigateToLogin)
            }
            is NetworkResult.Error -> {
                setLoading(false)
                setError(result.message)
            }
            else -> {}
        }
    }
}

data class LoginFormState(
    val isCardMode: Boolean = false,
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val passwordError: String? = null
)

data class LoginScreenState(
    val isSuccess: Boolean = false,
    val user: UserProfile? = null
)
```

**BaseViewModel Advantages**:
- Standard state container (state, isLoading, errorMessage, navigationEvent)
- Proper scope for all state flows
- Helper methods: updateState(), setError(), setLoading(), navigate()
- Ready for Compose (uses StateFlow, not LiveData)

---

## 📦 Build Configuration Changes

### gradle/libs.versions.toml (Create if not exists)

```toml
[versions]
android-gradle-plugin = "8.2.0"
kotlin = "1.9.22"
hilt = "2.48"
retrofit = "2.9.0"
okhttp = "4.12.0"
androidx-lifecycle = "2.7.0"
androidx-core = "1.12.0"
androidx-security = "1.1.0-alpha06"
coroutines = "1.7.3"
gson = "2.10.1"

[libraries]
android-gradle-plugin = { module = "com.android.tools.build:gradle", version.ref = "android-gradle-plugin" }
kotlin-gradle-plugin = { module = "org.jetbrains.kotlin:kotlin-gradle-plugin", version.ref = "kotlin" }
hilt-android-gradle-plugin = { module = "com.google.dagger:hilt-android-gradle-plugin", version.ref = "hilt" }
# ... rest of dependencies
```

### app/build.gradle.kts Changes

```gradle
buildFeatures {
    viewBinding = true
    buildConfig = true  // IMPORTANT: Required for AppConfig/BuildConfig fields
}

flavorDimensions += "environment"
// See full flavor config above
```

---

## 🎯 Migration Template for Remaining Features

### DashboardViewModel Template

```kotlin
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val sessionValidator: SessionValidator
) : BaseViewModel<DashboardScreenState>() {
    
    override fun createInitialState() = DashboardScreenState(
        stats = null,
        upcomingSessions = emptyList(),
        isRefreshing = false
    )
    
    init {
        // Auto-load dashboard data when ViewModel created
        loadDashboard()
    }
    
    fun loadDashboard() {
        setLoading(true)
        viewModelScope.launch {
            // 1. Check if session is still valid
            if (!sessionValidator.isSessionValid()) {
                setError("Session expired. Please log in again.")
                navigate(NavigationEvent.NavigateToLogin)
                return@launch
            }
            
            // 2. Load dashboard stats
            val statsResult = dashboardRepository.getDashboardStats()
            when (statsResult) {
                is NetworkResult.Success -> {
                    updateState { it.copy(stats = statsResult.data) }
                    loadUpcomingSessions()
                }
                is NetworkResult.Error -> {
                    setLoading(false)
                    setError(statsResult.message)
                }
                is NetworkResult.Unauthorized -> {
                    setLoading(false)
                    navigate(NavigationEvent.NavigateToLogin)
                }
                else -> {}
            }
        }
    }
    
    fun onRefresh() {
        updateState { it.copy(isRefreshing = true) }
        loadDashboard()
    }
}

data class DashboardScreenState(
    val stats: DashboardStats? = null,
    val upcomingSessions: List<SessionDto> = emptyList(),
    val isRefreshing: Boolean = false
)
```

### DashboardRepository Template

```kotlin
@Singleton
class DashboardRepository @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: ApiService
) {
    
    suspend fun getDashboardStats(): NetworkResult<DashboardStats> {
        return withContext(Dispatchers.IO) {
            try {
                val token = tokenManager.getAccessToken() ?: return@withContext 
                    NetworkResult.Unauthorized("Not authenticated")
                
                val response = apiService.getDashboardStats("Bearer $token")
                
                return@withContext when {
                    response.isSuccessful && response.body()?.success == true -> {
                        val data = response.body()?.data
                        if (data != null) NetworkResult.Success(data)
                        else NetworkResult.Error("No data in response")
                    }
                    response.code() == 401 -> {
                        tokenManager.clearTokens()
                        NetworkResult.Unauthorized("Session expired")
                    }
                    else -> {
                        val errorMsg = response.body()?.error?.message ?: "Failed to load stats"
                        NetworkResult.Error(errorMsg, response.code())
                    }
                }
            } catch (e: Exception) {
                ErrorHandler.handleException(e)
            }
        }
    }
}
```

---

## 🔐 Security & Privacy

### Token Security
- ✅ EncryptedSharedPreferences for all token storage
- ✅ Tokens never logged (masked in debug logs)
- ✅ Lock mechanism prevents concurrent token refresh
- ✅ Expiry buffer (5 min) for proactive refresh
- ✅ Tokens cleared on logout + 401 responses

### API Security
- ✅ AuthInterceptor prevents token leakage to public endpoints
- ✅ Proper Bearer token format: "Bearer {token}"
- ✅ Error messages don't leak sensitive info
- ✅ Build flavor prevents wrong environment connections

---

## 📊 Metrics & Next Steps

### Completed
- [x] NetworkResult<T> implementation
- [x] AppConfig & build flavors
- [x] Token refresh mechanism
- [x] SessionValidator
- [x] ErrorHandler & error classification
- [x] AuthInterceptor fix
- [x] AuthRepository refactor to NetworkResult
- [x] LoginViewModel StateFlow migration
- [x] BaseViewModel<State> foundation
- [x] NetworkModule DI updates

### In Progress
- [ ] DashboardViewModel → StateFlow
- [ ] ProfileViewModel → StateFlow
- [ ] RegisterViewModel → StateFlow (new)
- [ ] Activity layer integration
- [ ] Test coverage

### Not Started
- [ ] Session refresh interceptor (auto-refresh on 401)
- [ ] Offline caching layer
- [ ] Jetpack Compose screens
- [ ] E2E testing with new architecture

---

## 🚀 Deployment Checklist

### Pre-Release
- [ ] Test all three build flavors (dev, staging, prod)
- [ ] Verify token refresh on emulator
- [ ] Test logout clears all data
- [ ] Test 401 handling
- [ ] Verify no tokens in logs (production)
- [ ] Test app resume with expired token
- [ ] Network link conditioner testing

### Release
- [ ] Bump version code/name
- [ ] Update changelog
- [ ] Sign APK with production key
- [ ] Upload to Play Store internal testing
- [ ] Monitor crash logs

---

## 💡 Best Practices Going Forward

### Adding New Features
1. Create vertical slice in `features/{featureName}`
2. Layer structure: data → ui → domain (if needed)
3. Inherit ViewModel from BaseViewModel<State>
4. Use NetworkResult for all network calls
5. Add Hilt annotations (@HiltViewModel, @Inject)
6. Test with @HiltViewModel + @Singleton

### Code Style
- Use proper logging (Log.d for debug, Log.w for warnings)
- Mask sensitive data (cards, tokens) in logs
- Handle all NetworkResult states
- Validate in ViewModels before repository calls
- Use proper coroutine scope (viewModelScope)

### Error Handling
- Always provide user-friendly messages
- Log stack traces only in debug
- Classify errors for UI (critical, major, recoverable)
- Handle Unauthorized → navigate to login
- Retry transient errors (network, timeout)

---

**Document Version**: 1.0  
**Last Updated**: April 25, 2026  
**Maintained By**: Senior Android Engineer
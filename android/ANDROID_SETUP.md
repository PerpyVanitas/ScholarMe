# ScholarMe Android App - Setup Guide

This guide will help you set up the Android app for ScholarMe with the provided Kotlin code.

## Prerequisites

- Android Studio 4.1 or higher
- Kotlin 1.5 or higher
- Minimum SDK: API 21 (Android 5.0)
- Target SDK: API 34 (Android 14)

## Project Setup

### 1. Create a New Android Project

```bash
# Create a new Android project in Android Studio
# File → New → New Project
# Choose "Empty Activity" template
# Name: ScholarMe
# Package: com.example.scholarme
# Minimum SDK: API 21
```

### 2. Add Dependencies

Add these to your `build.gradle` (Module: app):

```gradle
dependencies {
    // Retrofit for API calls
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.10.0'
    
    // Kotlin Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.1'
    
    // AndroidX Security (for encrypted SharedPreferences)
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    
    // Lifecycle & ViewModel
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.1'
    
    // Compose (optional, for modern UI)
    implementation 'androidx.activity:activity-compose:1.7.2'
    implementation 'androidx.compose.ui:ui:1.5.1'
    implementation 'androidx.compose.material:material:1.5.1'
    
    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

### 3. Copy Kotlin Files

Copy the provided Kotlin files to your project:

```
src/main/java/com/example/scholarme/
├── api/
│   ├── ApiClient.kt
│   ├── ApiService.kt
│   └── (response/request classes)
├── repository/
│   └── AuthRepository.kt
├── viewmodel/
│   └── AuthViewModel.kt
├── ui/
│   ├── screens/
│   │   ├── LoginScreen.kt
│   │   ├── RegisterScreen.kt
│   │   ├── DashboardScreen.kt
│   │   └── ProfileScreen.kt
│   └── MainActivity.kt
└── data/
    └── preferences/
        └── AuthPreferences.kt
```

### 4. Initialize API Client in Application

Create `ScholarMeApplication.kt`:

```kotlin
package com.example.scholarme

import android.app.Application
import com.example.scholarme.api.ApiClient

class ScholarMeApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize API client with encrypted storage
        ApiClient.init(this)
    }
}
```

Update `AndroidManifest.xml`:

```xml
<application
    android:name=".ScholarMeApplication"
    ...>
    <!-- activities -->
</application>
```

### 5. Add Internet Permission

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## File Descriptions

### ApiClient.kt
Handles HTTP client initialization with:
- Encrypted token storage using AndroidX Security
- Bearer token interceptor for authenticated requests
- Error handling for token expiration (401 responses)
- Automatic token injection into requests

### ApiService.kt
Retrofit interface defining all API endpoints:
- Register, Login, Get Profile, Update Profile, Change Password
- Request/Response data classes matching API documentation
- Coroutine-based suspend functions

### AuthRepository.kt
Business logic layer that:
- Wraps API calls in Flow<Result<T>>
- Handles success/error responses
- Manages token storage on successful login
- Provides clean interface for ViewModels

### AuthViewModel.kt
MVVM ViewModel with:
- State management using StateFlow
- Login state tracking (Idle, Loading, Success, Error)
- Login status checks
- Sealed classes for type-safe state handling

## Integration Examples

### 1. Login Screen with Compose

```kotlin
@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    
    val authState by viewModel.authState.collectAsState()
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        TextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth()
        )
        
        TextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        
        Button(
            onClick = { viewModel.login(email, password) },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Login")
        }
        
        when (authState) {
            is AuthState.Loading -> CircularProgressIndicator()
            is AuthState.LoginSuccess -> {
                val data = (authState as AuthState.LoginSuccess).data
                Text("Welcome, ${data.profile.fullName}!")
            }
            is AuthState.Error -> {
                val error = authState as AuthState.Error
                Text("Error: ${error.message}", color = Color.Red)
            }
            else -> {}
        }
    }
}
```

### 2. Dashboard Screen

```kotlin
@Composable
fun DashboardScreen(viewModel: AuthViewModel) {
    val authState by viewModel.authState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.getProfile()
    }
    
    when (authState) {
        is AuthState.ProfileLoaded -> {
            val profile = (authState as AuthState.ProfileLoaded).profile
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Text("${profile.fullName}", style = MaterialTheme.typography.headlineSmall)
                Text("Email: ${profile.email}")
                Text("Phone: ${profile.phoneNumber ?: "Not set"}")
                
                if (profile.accountType == "tutor" && profile.tutorStats != null) {
                    val stats = profile.tutorStats
                    Text("Rating: ${stats.rating} (${stats.totalRatings} ratings)")
                    Text("Rate: ₱${stats.hourlyRate}/hour")
                }
                
                Button(onClick = { viewModel.logout() }) {
                    Text("Logout")
                }
            }
        }
        is AuthState.Loading -> CircularProgressIndicator()
        is AuthState.Error -> {
            val error = authState as AuthState.Error
            Text("Error: ${error.message}", color = Color.Red)
        }
        else -> {}
    }
}
```

## Key Implementation Notes

### 1. Token Security
- Tokens are stored in encrypted SharedPreferences
- Uses Android Keystore for encryption
- Not stored in plain text SharedPreferences

### 2. Error Handling
- 401 responses trigger automatic logout
- Network errors are caught and reported
- All API errors follow the same response format

### 3. Coroutine Usage
- All API calls are suspended functions
- Use viewModelScope for lifecycle safety
- Flow collections are safe in composition

### 4. Navigation
- Implement navigation between Login, Register, Dashboard
- Track authentication state with `isLoggedIn` StateFlow
- Navigate to Login on logout or token expiration

## Testing the API

### Using Postman/Insomnia

```bash
# Register
POST https://your-domain.com/api/android/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phoneNumber": "+639171234567",
  "accountType": "learner"
}

# Login
POST https://your-domain.com/api/android/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

# Get Profile (use token from login response)
GET https://your-domain.com/api/android/auth/profile
Authorization: Bearer {access_token}
```

## Troubleshooting

### Issue: "Failed to connect to API"
- Check internet permission in AndroidManifest.xml
- Verify BASE_URL in ApiClient.kt matches your backend
- Check if backend is accessible from emulator/device

### Issue: "401 Unauthorized"
- Token may be expired - clear app data and login again
- Check if Authorization header is being set correctly
- Verify token is being saved after login

### Issue: "Certificate pinning error"
- Add your SSL certificate to network security config
- Or disable for development (not recommended for production)

## Next Steps

1. Implement UI screens using Jetpack Compose or XML layouts
2. Add navigation between screens using Navigation Compose
3. Implement push notifications using Firebase Cloud Messaging
4. Add image upload capability using Blob storage
5. Implement session booking flow

For complete API documentation, see `ANDROID_API_DOCUMENTATION.md` in the backend repository.

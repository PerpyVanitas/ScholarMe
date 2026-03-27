# ScholarMe Android App - Build and Test Guide

## Prerequisites

### Required Software
- **Android Studio** (Latest version - Electric Eel or newer)
  - Download: https://developer.android.com/studio
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** (API level 28 or higher)
- **Git** for version control

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended for emulator)
- **Disk Space**: Minimum 10GB free
- **OS**: Windows, macOS, or Linux

## Step 1: Create Android Studio Project

### 1.1 Open Android Studio and Create New Project
1. Click "New Project"
2. Select "Empty Activity"
3. Configure project:
   - **Name**: ScholarMe
   - **Package name**: com.scholarme.app
   - **Save location**: Your preferred directory
   - **Language**: Kotlin
   - **Minimum SDK**: API 28 (Android 9.0)
   - **Target SDK**: API 34 (Android 14)
   - **Build configuration language**: Kotlin DSL

### 1.2 Update build.gradle.kts (Project level)

```kotlin
plugins {
    id("com.android.application") version "8.1.0" apply false
    id("com.android.library") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
}
```

### 1.3 Update build.gradle.kts (App level)

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.scholarme.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.scholarme.app"
        minSdk = 28
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.0"
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    
    // Jetpack Compose (Optional - for modern UI)
    implementation("androidx.compose.ui:ui:1.5.0")
    implementation("androidx.compose.material3:material3:1.1.0")
    implementation("androidx.activity:activity-compose:1.7.2")
    
    // Retrofit for API calls
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.1")
    
    // ViewModel and LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    
    // Security - for encrypted token storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    
    // DataStore for secure preferences
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Dependency Injection (Hilt)
    implementation("com.google.dagger:hilt-android:2.47")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
```

## Step 2: Add API Configuration

### 2.1 Create BuildConfig for API Base URL

Create a file `gradle.properties` in the project root:

```properties
API_BASE_URL=https://your-scholarme-domain.com
```

Update `build.gradle.kts` (app level):

```kotlin
defaultConfig {
    buildConfigFields {
        create("API_BASE_URL") {
            value = "\"${project.property("API_BASE_URL")}\""
        }
    }
}
```

### 2.2 Copy Kotlin Files to Project

1. Copy the following files to your Android project:
   - `ApiClient.kt` → `app/src/main/java/com/scholarme/app/network/`
   - `ApiService.kt` → `app/src/main/java/com/scholarme/app/network/`
   - `AuthRepository.kt` → `app/src/main/java/com/scholarme/app/data/`
   - `AuthViewModel.kt` → `app/src/main/java/com/scholarme/app/ui/`

2. Update package declarations in each file to match your project structure

## Step 3: Build the APK

### 3.1 Using Android Studio GUI

1. Go to **Build** menu → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete (5-10 minutes)
3. APK will be located at: `app/build/outputs/apk/debug/app-debug.apk`

### 3.2 Using Command Line (Gradle)

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing configuration)
./gradlew assembleRelease

# View build output
# APK location: app/build/outputs/apk/
```

## Step 4: Test on Android Emulator

### 4.1 Create Virtual Device

1. Open **Device Manager** in Android Studio (Tools → Device Manager)
2. Click **Create Device**
3. Select device model (e.g., Pixel 6)
4. Select API level (28 or higher)
5. Click **Finish**

### 4.2 Run App on Emulator

**Using Android Studio:**
1. Click **Run** (green play button)
2. Select your virtual device
3. Click **OK**

**Using Command Line:**
```bash
# List available devices
adb devices

# Install APK on emulator
adb install app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.scholarme.app/.MainActivity
```

## Step 5: Test on Physical Device

### 5.1 Enable Developer Mode

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Enable **Install via USB**

### 5.2 Connect Device via USB

```bash
# Verify device is connected
adb devices

# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Check logs during testing
adb logcat
```

## Step 6: Testing Checklist

### Registration Flow
- [ ] Open app and navigate to registration screen
- [ ] Enter email, password, first name, last name
- [ ] Verify form validation works
- [ ] Click Register and verify API response
- [ ] Check that session token is stored securely
- [ ] Verify navigation to dashboard after successful registration

### Login Flow
- [ ] Clear app data or reinstall
- [ ] Click Login
- [ ] Enter valid email and password
- [ ] Verify API call succeeds and token is stored
- [ ] Verify dashboard loads with user profile data
- [ ] Try with invalid credentials and verify error message

### Profile Screen
- [ ] Verify user profile data displays correctly
- [ ] Check avatar, name, email, bio (if tutor)
- [ ] For tutors: verify rating, experience, hourly rate display
- [ ] Test profile refresh functionality

### Update Profile
- [ ] Click "Edit Profile"
- [ ] Update first name, last name, bio
- [ ] Click Save and verify success message
- [ ] Check that updated data persists after app restart

### Change Password
- [ ] Click "Change Password"
- [ ] Enter current password and new password
- [ ] Verify success message
- [ ] Try logging in with old password (should fail)
- [ ] Try logging in with new password (should succeed)

### Session Management
- [ ] Log out and verify app clears session
- [ ] Verify token is removed from secure storage
- [ ] Verify user is redirected to login screen

## Step 7: Debugging

### View Logs
```bash
# Real-time logs
adb logcat -s "ScholarMe"

# Save logs to file
adb logcat > logs.txt
```

### Common Issues

**Issue**: "APK Installation Failed"
- Solution: Uninstall existing app first: `adb uninstall com.scholarme.app`

**Issue**: "Network Request Timeout"
- Solution: Verify backend API is running and accessible
- Check BuildConfig.API_BASE_URL is set correctly
- Use Android Emulator proxy: `adb shell settings put global http_proxy 10.0.2.2:8080`

**Issue**: "SecurityException with EncryptedSharedPreferences"
- Solution: Ensure device/emulator has Android Security & Privacy provider
- For older devices: Update to API 28+

**Issue**: "App Crashes on Login"
- Check logcat for actual error: `adb logcat | grep -i "scholme"`
- Verify API endpoint returns correct JSON format
- Check token storage permissions in AndroidManifest.xml

## Step 8: Generate Release APK (For Distribution)

### 8.1 Create Signing Key

```bash
keytool -genkey -v -keystore ~/scholarme-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias scholarme-key
```

### 8.2 Configure Signing in build.gradle.kts

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("../scholarme-release.keystore")
            storePassword = "your_password"
            keyAlias = "scholarme-key"
            keyPassword = "your_password"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### 8.3 Build Release APK

```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Network Issues
- Verify API base URL is correct in BuildConfig
- Check backend is running: `curl https://your-domain.com/api/android/auth/login`
- Use Android Profiler to inspect network requests

### Session Token Issues
- Clear app data: `adb shell pm clear com.scholarme.app`
- Check EncryptedSharedPreferences initialization
- Verify Bearer token format in API requests

### Build Issues
- Clean and rebuild: `./gradlew clean assembleDebug`
- Update Gradle: `./gradlew wrapper --gradle-version 8.1`
- Check Java version: `java -version` (should be 11+)

## Next Steps

1. **Implement UI Screens** - Create login, registration, dashboard layouts
2. **Add Navigation** - Use Navigation Component for screen transitions
3. **Implement Error Handling** - Add retry logic and offline support
4. **Add More Features** - Integrate with other backend endpoints
5. **Submit to Play Store** - Follow Google Play Store guidelines

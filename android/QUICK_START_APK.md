# ScholarMe Android APK - Quick Start Guide

## TL;DR - Get APK Running in 5 Minutes

### Option 1: Use Pre-Built APK (Easiest)

1. **Download Android Studio** (https://developer.android.com/studio)
2. **Open Android Emulator** or **Connect Physical Android Device**
3. **Install APK**:
   ```bash
   adb install app-debug.apk
   ```
4. **Open App** and test login

### Option 2: Build APK Yourself (10 Minutes)

```bash
# Clone repo or open project in Android Studio
# Then:
./gradlew assembleDebug

# APK created at: app/build/outputs/apk/debug/app-debug.apk

# Install on device/emulator
adb install app/build/outputs/apk/debug/app-debug.apk
```

## What You Need to Test

### Before Testing:
1. **Backend must be running** - Verify at: https://your-domain.com/api/android/auth/login
2. **Update API URL** in `ApiClient.kt`:
   ```kotlin
   companion object {
       private const val BASE_URL = "https://your-actual-domain.com"
   }
   ```

### Test Cases:

**1. Registration**
- Tap "Register"
- Fill: Email, Password, First Name, Last Name
- Tap "Register" button
- Should see success message and navigate to dashboard

**2. Login**
- Fresh app install or clear data
- Fill: Email and Password
- Tap "Login"
- Should navigate to dashboard showing your profile

**3. Profile View**
- Dashboard shows your name, email, and profile picture
- For tutors: Shows rating, experience, hourly rate

**4. Edit Profile**
- Tap "Edit Profile"
- Change first name or bio
- Tap "Save"
- Should update immediately

**5. Change Password**
- Tap "Change Password"
- Enter old password and new password
- Tap "Change"
- Success message should appear
- Try logging out and back in with new password

## Installation Methods

### Method 1: Android Studio GUI (Easiest)

```
1. Open Android Studio
2. Build → Build Bundle(s)/APK(s) → Build APK(s)
3. Wait 5-10 minutes
4. Click "Locate" to find APK file
5. Drag APK onto connected device or emulator
```

### Method 2: Command Line (Fastest)

```bash
# Build
./gradlew assembleDebug

# Install on connected device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat -s "ScholarMe"
```

### Method 3: Physical Device Setup

**On Your Android Phone:**
1. Settings → About Phone → Build Number (tap 7x)
2. Settings → Developer Options → Enable USB Debugging
3. Connect via USB cable

**On Computer:**
```bash
# Verify device connected
adb devices

# Install APK
adb install -r app-debug.apk

# Launch app
adb shell am start -n com.scholarme.app/.MainActivity
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot find adb" | Add Android SDK to PATH or use full path: `/Users/yourname/Library/Android/sdk/platform-tools/adb` |
| "Device offline" | Disconnect/reconnect USB cable, check USB permissions |
| "APK Installation failed" | Run: `adb uninstall com.scholarme.app` then retry |
| "App crashes on startup" | Check API_BASE_URL is correct, verify backend is running |
| "Login button doesn't work" | Check internet permission in AndroidManifest.xml |
| "Network timeout" | Verify backend is accessible: `curl https://your-domain.com/api/android/auth/login` |

## Architecture Overview

```
ScholarMe Android App
├── MainActivity.kt (Entry point - routes to login or dashboard)
├── ApiClient.kt (HTTP client with Retrofit)
├── ApiService.kt (API endpoints)
├── AuthRepository.kt (Business logic)
├── AuthViewModel.kt (UI state management)
├── ui/
│   ├── auth/
│   │   ├── LoginActivity.kt
│   │   └── RegisterActivity.kt
│   ├── dashboard/
│   │   └── DashboardActivity.kt
│   └── profile/
│       ├── ProfileActivity.kt
│       ├── EditProfileActivity.kt
│       └── ChangePasswordActivity.kt
└── resources/
    ├── layouts/
    │   ├── activity_login.xml
    │   ├── activity_register.xml
    │   ├── activity_dashboard.xml
    │   └── ...
    └── strings.xml
```

## Testing Flows

### Happy Path (Everything Works)

```
App Launch
  ↓
Has Token? No → Login Activity
  ↓
Enter Email/Password → API Login
  ↓
Success → Save Token → Dashboard Activity
  ↓
Shows Profile Data
```

### Error Handling

```
Invalid Login
  ↓
API Returns 401
  ↓
Show "Invalid email/password" Toast
  ↓
Stay on Login Screen
```

## Environment Variables

Update in `ApiClient.kt`:

```kotlin
companion object {
    // Change this to your actual backend URL
    private const val BASE_URL = "https://your-domain.com"
    
    // For local testing:
    // private const val BASE_URL = "http://10.0.2.2:3000"
    // (10.0.2.2 = localhost in emulator)
}
```

## Debug Commands

```bash
# See all network requests
adb logcat | grep -i "retrofit"

# See all errors
adb logcat | grep -i "error"

# See specific app logs
adb logcat | grep -i "scholarme"

# Clear app data
adb shell pm clear com.scholarme.app

# View SharedPreferences (tokens)
adb shell "run-as com.scholarme.app cat /data/data/com.scholarme.app/shared_prefs/*.xml"

# View app files
adb shell run-as com.scholarme.app ls -la /data/data/com.scholarme.app
```

## Next: After APK Works

1. **Build UI Screens** - Create XML layouts for better UX
2. **Add Error Handling** - Implement retry logic
3. **Add Offline Support** - Cache data locally
4. **Add More Features** - Tutors list, sessions, etc.
5. **Submit to Play Store** - Generate release APK with signing key

## Support

For issues:
1. Check backend logs: `heroku logs --tail` (if using Heroku)
2. Check logcat: `adb logcat -s "ScholarMe"`
3. Verify API: `curl -X POST https://your-domain.com/api/android/auth/login -d '{"email":"test@test.com","password":"test123"}'`
4. Check network: Emulator needs proxy for local development

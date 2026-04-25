# ScholarMe Android Developer Guide

This guide covers everything you need to know to set up, build, test, and troubleshoot the ScholarMe Android application.

## Prerequisites

- **Android Studio** (Latest version recommended)
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** (Minimum API 28, Target API 34)
- **RAM**: Minimum 8GB (16GB recommended for emulator)

---

## 1. Project Setup

### Opening the Project
1. In Android Studio, click **File → Open**.
2. Navigate to your cloned ScholarMe repository.
3. Select the **`android`** folder (NOT the root folder) and click **Open**.
4. Wait for Gradle to finish syncing. If it fails, try **File → Invalidate Caches → Invalidate and Restart**.

### API Configuration
To test against a real backend, ensure `BASE_URL` is set correctly in `ApiClient.kt` (or via Hilt configuration). 

```kotlin
// For Local testing via Emulator:
private const val BASE_URL = "http://10.0.2.2:3000"

// For Production:
private const val BASE_URL = "https://your-domain.com"
```

---

## 2. Building and Installing the APK

### Method A: Using Android Studio (GUI)
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
2. Wait 2-5 minutes. A popup will appear saying "Build complete!".
3. Click **Locate** to see your APK file. Drag it onto your emulator to install.

### Method B: Using Command Line (Terminal)
Open the Terminal inside Android Studio (or your native terminal) and run:
```bash
# Build the Debug APK
./gradlew assembleDebug

# Install on connected device/emulator
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Testing the Application

### Running on a Physical Device
1. Connect your phone via USB.
2. Enable Developer Mode (Settings → About Phone → tap Build Number 7 times).
3. Enable USB Debugging (Settings → Developer Options → USB Debugging).
4. Click the green **Run** button in Android Studio.

### Core Flows to Test
- **Registration**: Register a new Learner or Tutor. Ensure the Dashboard loads afterward.
- **Login**: Log in with existing credentials. Confirm profile data loads.
- **Profile Edit**: Try updating your First Name or Bio and hitting Save.
- **Change Password**: Ensure old password auth prevents saving if incorrect.
- **Session Expiration**: Backend 401s should automatically route the user back to the Login screen.

---

## 4. Architecture Overview

The app follows a modern Android Architecture (Vertical Slice/MVVM):
- **Dependency Injection**: Hilt
- **Network**: Retrofit + OkHttp (with Interceptors for Auth)
- **Concurrency**: Kotlin Coroutines + `StateFlow`
- **UI Architecture**: Model-View-ViewModel (MVVM)

### Package Structure
```
app/src/main/java/com/scholarme/
├── core/             # Shared logic (Result wrappers, Base classes, DI Modules)
├── features/         # Vertical Slices
│   ├── auth/         # Login & Register
│   ├── dashboard/    # Main Dashboard & Sessions
│   └── profile/      # Profile Viewing & Editing
└── MainActivity.kt   # Entry Point (Routes based on SessionValidator)
```

---

## 5. Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| **"Cannot find adb"** | Add Android SDK to your PATH or use the full path to `adb`. |
| **"APK Installation failed"** | Uninstall the existing app first: `adb uninstall com.scholarme` |
| **"Network Request Timeout"** | Verify backend is running. If using emulator locally, ensure `10.0.2.2` is used instead of `localhost`. |
| **"App crashes on startup"** | Check logcat: `adb logcat -s "ScholarMe"`. It is usually an issue with Hilt injection or API URL. |

### Helpful Debug Commands
```bash
# See all network requests (Retrofit)
adb logcat | grep -i "retrofit"

# Clear app data completely (logout simulation)
adb shell pm clear com.scholarme

# View stored SharedPreferences (tokens)
adb shell "run-as com.scholarme cat /data/data/com.scholarme/shared_prefs/*.xml"
```

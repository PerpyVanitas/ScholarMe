# Simple APK Build Guide for ScholarMe Android App

## Step 1: Open Android Studio Project

1. Open Android Studio
2. Go to **File → Open**
3. Navigate to your cloned GitHub folder
4. Select the **`android`** folder (NOT the root folder)
5. Click Open

This opens ONLY the Android app, ignoring the Java backend errors.

## Step 2: Wait for Gradle Sync

Android Studio will show a popup: **"Gradle files have changed since the last sync"**

- Click **Sync Now**
- Wait for dependencies to download (this takes 2-5 minutes on first build)
- You should see: **"Gradle sync finished"** at the bottom

## Step 3: Build the APK

### Option A: Using Android Studio GUI (Easiest)

1. Click **Build** menu at the top
2. Select **Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete (2-3 minutes)
4. You'll see: **"APK(s) generated successfully"** with a popup showing the file location

### Option B: Using Terminal

Open Android Studio's Terminal (View → Tool Windows → Terminal) and run:

```bash
./gradlew assembleDebug
```

The APK will be at: `app/build/outputs/apk/debug/app-debug.apk`

## Step 4: Install on Phone or Emulator

### Option A: Physical Android Phone (Recommended)

1. Enable USB Debugging on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Go back to Settings → Developer Options → Enable "USB Debugging"
   
2. Connect phone to computer via USB

3. In Android Studio, click **Run** → **Run 'app'**
   - Or press **Shift + F10**

4. Select your phone from the device list

5. App will install and launch automatically

### Option B: Android Emulator

1. Create a virtual device:
   - Tools → AVD Manager → Create Virtual Device
   - Select a device (e.g., Pixel 5)
   - Select Android version (API 31 or higher)
   - Click Finish

2. Start the emulator:
   - Click the green Play button next to your emulator
   - Wait for it to fully boot

3. In Android Studio, click **Run 'app'** (Shift + F10)

4. Select your emulator from the device list

5. App will install automatically

## Step 5: Test the App

### First-Time Setup
1. Open the ScholarMe app on your phone
2. You'll see the Login screen
3. Tap **Sign Up** to create an account
   - Email: any email (e.g., test@example.com)
   - Password: any password (min 6 chars)
   - Role: Select Learner or Tutor
   - Click Register

4. After registration, you'll be logged in automatically

5. You'll see the Dashboard with your profile info

### Testing Features
- **Login/Logout**: Test authentication with different accounts
- **Profile**: View your user information
- **Update Profile**: Edit your name, bio, etc.
- **Change Password**: Test password change functionality

## Troubleshooting

### "Build Failed" with Gradle Error
```
Solution: 
1. File → Invalidate Caches → Invalidate and Restart
2. Build → Clean Project
3. Build → Build APK(s) again
```

### "No Connected Devices Found"
```
For USB: Check if USB debugging is enabled on phone
For Emulator: Make sure emulator is fully booted (takes 1-2 min)
```

### "Manifest merger failed"
```
Solution:
1. File → Project Structure
2. Select "app" module
3. Go to Dependencies tab
4. Remove any conflicting libraries
5. Sync and rebuild
```

### App Crashes on Launch
```
Check the Logcat (View → Tool Windows → Logcat)
Look for red errors with "Exception"
Common causes:
- Wrong API_BASE_URL in ApiClient.kt
- Internet permission not granted
- Backend server not running
```

## API Configuration

Before building, update the API URL in your Android code:

**File:** `android/ApiClient.kt`

```kotlin
companion object {
    private const val API_BASE_URL = "https://your-deployed-url.com/"
}
```

Replace `https://your-deployed-url.com/` with:
- For testing: `http://10.0.2.2:8080/` (Android emulator to local machine)
- For production: Your actual backend URL

## Expected Result

✅ APK successfully built
✅ App installs on phone/emulator
✅ Login screen appears
✅ Can create account and login
✅ Can view profile
✅ Can update profile
✅ Can change password

## Getting Help

If you encounter issues:
1. Check Logcat for error messages (View → Tool Windows → Logcat)
2. Ensure your Android SDK is updated (Tools → SDK Manager)
3. Verify Gradle version (File → Project Structure → Project)
4. Clear cache: File → Invalidate Caches → Invalidate and Restart

---

**That's it! You should now have a working ScholarMe app APK ready to install and test.**

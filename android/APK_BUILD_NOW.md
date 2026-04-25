# Build APK - Final Steps

## What I Just Added
I've created all the missing Gradle build files:
- `build.gradle.kts` (app module)
- `build.gradle.kts` (root project)
- `settings.gradle.kts`
- `gradle.properties`
- `proguard-rules.pro`

Your Android folder is now a complete, buildable Android Studio project!

## Steps to Build APK

### Step 1: Close Current Project
1. In Android Studio, go to **File → Close Project**
2. Don't close Android Studio itself

### Step 2: Open the Android Folder
1. Click **File → Open**
2. Navigate to your cloned ScholarMe repository
3. Select the **`android`** folder (NOT the root)
4. Click **Open**
5. Click **Trust Project** if prompted

### Step 3: Wait for Gradle Sync
- Android Studio will automatically download dependencies
- This may take 2-5 minutes (first time)
- You'll see "Gradle Build Finished" at the bottom

### Step 4: Build the APK
**Option A: Using GUI (Easiest)**
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete (may take 2-3 minutes)
3. A popup will appear saying "Build complete!"
4. Click **Locate** to see your APK file

**Option B: Using Terminal**
1. Open Terminal in Android Studio (View → Tool Windows → Terminal)
2. Run: `./gradlew assembleDebug`
3. APK will be at `app/build/outputs/apk/debug/app-debug.apk`

### Step 5: Install APK on Phone

**Physical Phone (Recommended):**
1. Connect phone via USB cable
2. Enable Developer Mode: Settings → About Phone → tap Build Number 7 times
3. Enable USB Debugging: Settings → Developer Options → USB Debugging
4. In Android Studio, go to **Build → Select Build Variant → debug**
5. Click the Run button (green play icon) or go to **Run → Run 'app'**
6. Choose your connected phone
7. App will install and launch automatically

**Android Emulator:**
1. In Android Studio, go to **Tools → Device Manager**
2. Create a virtual device (if you don't have one)
3. Start the emulator
4. Click the Run button (green play icon)
5. Select the emulator
6. App will install and launch

### Step 6: Test the App
Once installed, the app will open. You can:
- Register a new account
- Login with existing account
- View your profile
- Update your profile
- Change password

## Troubleshooting

**"Gradle sync failed"**
- Go to **File → Invalidate Caches** → **Invalidate and Restart**
- Android Studio will rebuild everything

**"Android SDK not found"**
- Go to **File → Settings → Appearance & Behavior → System Settings → Android SDK**
- Click **SDK Tools** and download the required Android SDK version

**"Build failed"**
- Make sure you opened the `android` folder, NOT the root folder
- Delete `.gradle` folder in the android directory
- Run **Build → Rebuild Project**

## Success!
Once the APK is built and installed, you have a working ScholarMe Android app that connects to your backend APIs!

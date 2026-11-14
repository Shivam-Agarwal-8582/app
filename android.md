# SplitWise Android Application — Build & Deployment Guide

> **Project Package ID**: `com.shivam.splitwiseclone`  
> **Application Name**: `SplitWise`  
> **Target SDK**: Android 14/15+ (`compileSdkVersion = 36`, `targetSdkVersion = 36`, `minSdkVersion = 24`)  
> **Architecture**: Capacitor Native Android Bridge + React 18 SPA + Spring Boot 3.3 Backend  

---

## 1. Prerequisites

Before running or building the Android application, make sure you have:
1. **Java JDK 17 or 21** installed.
2. **Android Studio** installed (from [developer.android.com/studio](https://developer.android.com/studio)).
   - During setup, install **Android SDK Platform 34 or 35**, **Android SDK Command-line Tools**, and **Android SDK Build-Tools**.
   - Ensure `ANDROID_HOME` or `ANDROID_SDK_ROOT` is configured in your terminal:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```
3. **Node.js 18+ and npm 10+** (already verified on your machine).

---

## 2. Fast Build & Sync Workflow

From the `frontend/` directory, run:

```bash
cd frontend

# Step 1: Compile React and sync assets with Android
npm run cap:build
```

This single command:
1. Compiles TypeScript and runs Vite production build (`tsc && vite build`).
2. Copies all web assets into `frontend/android/app/src/main/assets/public/`.
3. Synchronizes Capacitor plugins and configurations.

---

## 3. Configuring Backend Connectivity

### A. Testing on Android Emulator:
The Android emulator runs inside an isolated virtual network where `10.0.2.2` maps directly to your host computer's `localhost`.
1. Ensure your Spring Boot backend is running on port `8080`.
2. The application already defaults to `http://10.0.2.2:8080/api/v1` and `ws://10.0.2.2:8080/ws` when running inside the Android emulator.

### B. Testing on a Physical Android Device:
1. Connect your Android phone and computer to the **same Wi-Fi network**.
2. Find your computer's local IP address:
   - On macOS: Run `ipconfig getifaddr en0` (or `ifconfig`). Example: `192.168.1.45`.
3. Create `frontend/.env.production` or `frontend/.env.local`:
   ```bash
   VITE_API_BASE_URL=http://192.168.1.45:8080/api/v1
   VITE_WS_URL=ws://192.168.1.45:8080/ws
   ```
4. Re-sync Capacitor:
   ```bash
   npm run cap:build
   ```

### C. Testing on Web Browser:
The web browser continues to use relative `/api/v1` and the Vite dev server proxy or deployed Nginx proxy:
```bash
npm run dev
# Starts web at http://localhost:3000
```

---

## 4. Opening the Project in Android Studio

To open the native Android project in Android Studio:

```bash
cd frontend
npm run cap:open
```

Or open Android Studio manually $\rightarrow$ **Open Project** $\rightarrow$ select the directory:
`/Users/shivamagarwal/Desktop/split wise clone/frontend/android`

Allow Gradle to finish syncing its project dependencies (1-2 minutes on first open).

---

## 5. Running the Application

### Option A: From Android Studio
1. Select your target device from the device dropdown (either a running Android Virtual Device / Emulator or your physical device connected via USB with **USB Debugging** enabled).
2. Click the green **Run (▶)** button or press `Shift + F10`.

### Option B: From Command Line (CLI)
Ensure an emulator or device is connected (`adb devices`):
```bash
cd frontend
npx cap run android
```

---

## 6. Generating a Debug APK

To generate a debug APK file that you can install directly on any Android device:

### Via Command Line:
```bash
cd frontend/android
./gradlew assembleDebug
```
The output APK will be generated at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

To install directly onto a connected phone:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. Generating a Signed Release APK & Android App Bundle (AAB)

For distribution or submitting to the **Google Play Store**:

### Step 1: Generate a Release Keystore (One-Time)
Run this command in terminal to create a cryptographic signing key:
```bash
keytool -genkey -v -keystore splitwise-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias splitwise -deststoretype JKS
```
*(Store this file and your passwords securely).*

### Step 2: Generate Signed AAB or APK via Android Studio
1. In Android Studio, go to the top menu: **Build** $\rightarrow$ **Generate Signed Bundle / APK...**
2. Choose:
   - **Android App Bundle (.aab)** (Recommended for Google Play Store).
   - **APK** (For direct distribution or sideloading).
3. Select your `splitwise-release-key.jks` keystore path, enter the passwords, and select alias `splitwise`.
4. Select destination folder and choose **release** build variant.
5. Click **Finish**.

The signed bundle will be generated at:
- AAB: `frontend/android/app/release/app-release.aab`
- APK: `frontend/android/app/release/app-release.apk`

---

## 8. Verified Features Checklist on Android

- [x] **Secure Token Storage**: Uses `@capacitor/preferences` (Android `SharedPreferences`) in private sandboxed storage; tokens persist across app restarts and never leak in logs.
- [x] **Hardware Back-Button**: Intercepts physical back button to navigate backwards in React Router history or minimize the app at the dashboard.
- [x] **Safe-Area Insets**: Status bar and navigation bar padding automatically respects notches, camera cutouts, and bottom gesture indicators.
- [x] **Status Bar Dynamic Sync**: Automatically syncs status bar theme (Dark/Light) with SplitWise's theme toggle.
- [x] **Mobile Bottom Navigation**: Sleek, thumb-friendly bottom navigation bar (`BottomNav.tsx`) for mobile screens.
- [x] **Soft Keyboard Resize**: Modals and chat views gracefully adjust when the virtual keyboard opens.
- [x] **Dual Currency Support**: Fully operational INR (₹) and live USD ($) equivalent display.
- [x] **Real-Time Group Chat**: STOMP over WebSocket with auto-derived mobile endpoints, image uploads, and read receipts.


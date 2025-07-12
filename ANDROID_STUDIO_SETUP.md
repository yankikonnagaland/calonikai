# Android Studio Setup Guide for Calonik.ai (Expo Project)

## Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with default settings including Android SDK

2. **Install Node.js**
   - Download from: https://nodejs.org/ (LTS version recommended)
   - Verify installation: `node --version` and `npm --version`

3. **Install Expo CLI and EAS CLI**
   ```bash
   npm install -g @expo/cli eas-cli
   ```

4. **Install Java Development Kit (JDK)**
   - Android Studio usually includes this, but ensure JDK 11 or higher is installed
   - Check: `java -version`

## Setup Steps

### Step 1: Install Dependencies

```bash
# Navigate to your project directory
cd /path/to/your/calonik-project

# Install main project dependencies
npm install --legacy-peer-deps

# Navigate to mobile directory  
cd mobile

# Install mobile-specific dependencies
npm install --legacy-peer-deps
```

### Step 2: Configure Android Environment

1. **Set Environment Variables** (Add to your `.bashrc`, `.zshrc`, or system environment):
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

2. **Install Android SDK Components** (via Android Studio):
   - Open Android Studio
   - Go to Tools > SDK Manager
   - Install:
     - Android SDK Platform 34 (API Level 34)
     - Android SDK Build-Tools 34.0.0
     - Android Emulator
     - Android SDK Platform-Tools

### Step 3: Set Up Android Virtual Device (AVD)

1. **Create AVD**:
   - In Android Studio: Tools > AVD Manager
   - Click "Create Virtual Device"
   - Choose device: Pixel 4 or Pixel 6 (recommended)
   - Select system image: API Level 34 (Android 14)
   - Configure AVD settings and click Finish

2. **Start Emulator**:
   - Click the play button next to your AVD
   - Wait for emulator to fully boot

### Step 4: Run the Expo React Native App

#### Option A: Using Expo Development Build (Recommended)

```bash
# From the mobile directory
cd mobile

# Start Expo development server
npx expo start

# Press 'a' to open on Android emulator
# OR scan QR code with Expo Go app on physical device
```

#### Option B: Create APK for Android Studio Testing

```bash
# From the mobile directory
cd mobile

# Build Android APK
eas build --platform android --profile apk

# Or for local development
npx expo run:android
```

#### Option C: Using Android Studio (After EAS Build)

1. **Generate Android Project**:
   ```bash
   cd mobile
   npx expo run:android
   ```

2. **Open in Android Studio**:
   - This creates an `android/` folder
   - Open Android Studio
   - Select "Open an existing project"
   - Navigate to `/your-project/mobile/android/` and select this folder
   - Wait for Gradle sync to complete

3. **Build and Run**:
   - Ensure your AVD is running
   - Click the green "Run" button or press Shift+F10
   - Select your virtual device when prompted

### Step 5: Connect to Backend Server

The mobile app is configured to connect to your Replit backend. Ensure:

1. **Backend is Running**:
   ```bash
   # In your main project directory
   npm run dev
   ```

2. **Update API Base URL** (if needed):
   - Edit `mobile/src/config/api.js` if the backend URL needs updating
   - Current URL should be: `https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev`

## Project Structure

```
mobile/
├── src/
│   ├── screens/           # 5 main screens
│   │   ├── HomeScreen.js    # Food search and tracking
│   │   ├── CameraScreen.js  # AI food recognition
│   │   ├── ExerciseScreen.js # Exercise tracking
│   │   ├── ProfileScreen.js  # User profile and BMR/TDEE
│   │   └── DashboardScreen.js # Analytics and progress
│   ├── components/        # Reusable components
│   ├── services/         # API calls and AsyncStorage
│   └── utils/            # Helper functions
├── android/              # Native Android code
├── App.js               # Main app component with navigation
└── package.json         # Dependencies and scripts
```

## Features Available in Mobile App

✅ **Complete Food Tracking**: Search foods, add to meals, view nutrition
✅ **AI Food Recognition**: Camera integration with AI analysis
✅ **Exercise Tracking**: Timer-based workouts with calorie calculations
✅ **User Profile**: BMR/TDEE calculations and goal setting
✅ **Health Dashboard**: Weekly trends and progress analytics
✅ **Offline Storage**: AsyncStorage for session persistence
✅ **Real-time API**: Full integration with Replit backend

## Troubleshooting

### Common Issues:

1. **Metro bundler not starting**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Gradle build failure**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

3. **Package resolution issues**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

4. **Emulator not detected**:
   - Ensure emulator is fully booted
   - Check: `adb devices` should show your emulator

5. **Network issues**:
   - Ensure backend server is running and accessible
   - Check firewall settings
   - Verify API URLs in mobile app configuration

## Building APK for Testing

### Method 1: EAS Build (Recommended)
```bash
cd mobile

# Build APK for testing
eas build --platform android --profile apk

# Download APK from EAS dashboard when ready
```

### Method 2: Local Build (After expo run:android)
```bash
# Generate debug APK (only after running expo run:android)
cd mobile/android
./gradlew assembleDebug

# APK will be available at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Quick Development Workflow

### For Testing in Android Studio:
1. Start backend server: `npm run dev` (from main project)
2. Start Expo dev server: `npx expo start` (from mobile folder)
3. Press 'a' to launch on Android emulator
4. Or scan QR code with Expo Go app

### For Production APK:
1. Configure EAS: `eas build:configure`
2. Build APK: `eas build --platform android --profile apk`
3. Download and install APK on device

## Next Steps

- Test all features in the emulator
- Try on physical device for real-world testing
- Use EAS Build for production APK when ready
- Submit to Google Play Store for distribution

For any issues, check the console logs in both Android Studio and Metro bundler for debugging information.
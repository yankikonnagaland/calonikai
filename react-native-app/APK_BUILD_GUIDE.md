# 📱 Calonik AI - APK Build Guide

## 🚀 Quick APK Generation Steps

Since building an APK requires Expo account authentication, follow these steps on your local machine:

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g @expo/cli`
- Expo account (free registration at expo.dev)

### Step 1: Setup Local Environment
```bash
# Clone or download the react-native-app folder to your local machine
cd react-native-app

# Install dependencies
npm install
```

### Step 2: Login to Expo
```bash
# Login to your Expo account
npx eas login

# Verify login
npx eas whoami
```

### Step 3: Initialize EAS Project
```bash
# Initialize EAS build configuration
npx eas build:configure
```

### Step 4: Build APK
```bash
# Build APK for testing (preview profile)
npx eas build --platform android --profile preview

# Or build production APK
npx eas build --platform android --profile production
```

### Step 5: Download APK
- The build will be uploaded to Expo's servers
- You'll receive a download link in the terminal
- Download the APK and install on your Android device

## 🔧 Alternative: Local APK Build

If you prefer building locally without uploading to Expo servers:

### Step 1: Install Android Development Tools
```bash
# Install Android Studio and SDK
# Add Android SDK to PATH
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Step 2: Build Locally
```bash
# Generate local APK
npx eas build --platform android --profile preview --local
```

## 📋 Current Project Configuration

### EAS Build Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### App Configuration (app.json)
- **App Name**: Calonik AI
- **Bundle ID**: com.calonik.ai
- **Version**: 1.0.0
- **SDK Version**: 52
- **Permissions**: Camera, Photo Library

## 📱 Installation Instructions

### For Android APK:
1. Enable "Unknown Sources" in Android Settings
2. Download the APK file
3. Tap the APK file to install
4. Grant necessary permissions (Camera, Storage)

### For Testing:
- Install Expo Go app from Google Play Store
- Scan QR code when running `npx expo start`
- Test all features directly on your device

## 🔍 Troubleshooting

### Common Issues:

**Build Fails - Authentication Error:**
```bash
# Re-login to Expo
npx eas logout
npx eas login
```

**Build Fails - Configuration Error:**
```bash
# Reconfigure EAS
npx eas build:configure --force
```

**Local Build Fails - Android SDK Missing:**
```bash
# Install Android Studio
# Set ANDROID_HOME environment variable
# Install required SDK versions
```

### Build Logs:
- Check build logs on expo.dev dashboard
- Common issues: Missing dependencies, configuration errors
- All dependencies are already configured in package.json

## 📊 Project Stats

### ✅ Ready for Build:
- **Complete React Native App**: All screens and components implemented
- **Dependencies Configured**: All required packages in package.json
- **EAS Configuration**: Build profiles set up for APK generation
- **App Metadata**: Proper app.json configuration with permissions
- **Dark Theme**: Matching web app design (#0f172a, #f97316)

### 🎯 Features in APK:
- Food tracking with intelligent search
- BMR/TDEE calculator and goal setting
- Exercise logging with built-in timer
- Health dashboard with progress tracking
- Camera integration for food analysis
- Offline functionality with local storage
- Calendar navigation for historical data

## 🚀 Build Timeline

**Estimated Build Time:**
- **Cloud Build (EAS)**: 5-15 minutes
- **Local Build**: 10-30 minutes (first time)
- **Subsequent Builds**: 2-5 minutes

**File Size:**
- **APK Size**: ~15-25 MB
- **Installation Size**: ~40-60 MB

## 📱 Final APK Features

Your APK will include:
✅ Complete Calonik AI mobile experience
✅ Offline data storage and synchronization
✅ Native performance with React Native
✅ Camera and photo permissions configured
✅ Dark theme matching web application
✅ All 4 main screens (Tracker, Profile, Exercise, Dashboard)
✅ Ready for backend API integration

---

**After following these steps, you'll have a fully functional Calonik AI APK ready for installation and testing!**
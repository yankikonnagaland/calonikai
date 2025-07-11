# Complete Android APK Build Guide for Calonik.ai

## Overview
This guide provides multiple methods to build an Android APK for your Calonik.ai mobile app, including EAS Build (cloud), local builds, and alternative solutions.

## Method 1: EAS Build (Recommended - Cloud Build)

### Prerequisites
- Expo account (free at https://expo.dev)
- EAS CLI installed globally

### Step-by-Step Instructions

1. **Install EAS CLI globally (if not already installed)**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account**
   ```bash
   eas login
   ```

3. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

4. **Configure EAS project (if needed)**
   ```bash
   eas build:configure
   ```

5. **Build Android APK**
   ```bash
   # Build APK for testing/distribution
   eas build --platform android --profile apk

   # Alternative: Build preview APK
   eas build --platform android --profile preview
   ```

6. **Download and Install**
   - Build will complete in 5-15 minutes
   - You'll receive a download link for the APK
   - Download and install on Android devices

### EAS Build Features
- ✅ No local Android SDK setup required
- ✅ Cloud-based building (fast and reliable)
- ✅ Automatic code signing
- ✅ Build history and management
- ✅ Works from any operating system

## Method 2: Local Android Build

### Prerequisites
- Android Studio with SDK
- Java Development Kit (JDK)
- Android SDK Build Tools
- Platform Tools

### Setup Steps

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK (API level 21 or higher)
   - Set up environment variables (ANDROID_HOME, PATH)

2. **Build locally with Expo**
   ```bash
   cd mobile
   
   # Install dependencies
   npm install
   
   # Build APK locally
   expo build:android --type apk
   ```

3. **Alternative: React Native CLI**
   ```bash
   cd mobile
   
   # Generate Android project
   expo eject
   
   # Build with Gradle
   cd android
   ./gradlew assembleRelease
   ```

## Method 3: Expo Development Build

### For Testing During Development

1. **Install Expo Go app** on your Android device from Play Store

2. **Start development server**
   ```bash
   cd mobile
   npm start
   ```

3. **Scan QR code** with Expo Go app to test

### For Custom Native Code
```bash
cd mobile

# Create development build
expo install expo-dev-client
eas build --profile development --platform android
```

## Configuration Files

### EAS Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal", 
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "aab"
      }
    },
    "apk": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "Calonik - AI Calorie Tracker",
    "slug": "calonik",
    "version": "1.0.0",
    "android": {
      "package": "ai.calonik.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE", 
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## Build Profiles Explained

### APK Profile
- **Output**: `.apk` file
- **Use**: Direct installation, sideloading, testing
- **Size**: Larger (includes all architectures)
- **Command**: `eas build --platform android --profile apk`

### AAB Profile (Production)
- **Output**: `.aab` (Android App Bundle)
- **Use**: Google Play Store submission
- **Size**: Smaller (optimized by Play Store)
- **Command**: `eas build --platform android --profile production`

## Installation Guide

### Installing APK on Android Device

1. **Enable Unknown Sources**
   - Go to Settings > Security
   - Enable "Install unknown apps" or "Unknown sources"

2. **Download APK**
   - Download from EAS build link
   - Or transfer from computer

3. **Install**
   - Tap on APK file
   - Follow installation prompts

### For Multiple Devices
- Share the EAS build download link
- Recipients can download and install directly
- No Play Store approval needed

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and retry
   eas build --platform android --profile apk --clear-cache
   ```

2. **Dependency Conflicts**
   ```bash
   cd mobile
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Expo CLI Issues**
   ```bash
   npm install -g @expo/cli@latest eas-cli@latest
   ```

### Check Build Status
```bash
# List all builds
eas build:list

# Check specific build
eas build:view [BUILD_ID]

# View build logs
eas build:view [BUILD_ID] --logs
```

## Production Deployment

### Google Play Store
1. Build AAB: `eas build --platform android --profile production`
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review

### Direct Distribution
1. Build APK: `eas build --platform android --profile apk`
2. Share download link
3. Users install directly

## Development Workflow

### Recommended Flow
1. **Development**: Use Expo Go for testing
2. **Testing**: Build APK with `apk` profile
3. **Production**: Build AAB with `production` profile

### Quick Commands
```bash
# Development testing
npm start

# Build test APK
eas build --platform android --profile apk

# Build production
eas build --platform android --profile production

# Check builds
eas build:list
```

## Security & Signing

### Automatic Signing (EAS)
- EAS automatically handles code signing
- Creates keystore and manages certificates
- Consistent signing across builds

### Manual Signing (Advanced)
```bash
# Generate keystore
keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-upload-key.keystore app-release-unsigned.apk my-key-alias
```

## Next Steps

1. **Choose build method** (EAS recommended)
2. **Set up authentication** (for EAS builds)
3. **Run build command**
4. **Download and test APK**
5. **Distribute to users or submit to Play Store**

## Support Resources

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Expo Forums**: https://forums.expo.dev/
- **Android Developer Guide**: https://developer.android.com/guide
- **React Native Documentation**: https://reactnative.dev/docs/getting-started
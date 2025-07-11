# Android APK Build Guide for Calonik.ai

## Overview
This guide will help you build an Android APK for the Calonik.ai mobile app using Expo Application Services (EAS).

## Prerequisites
1. **Expo CLI installed globally**
   ```bash
   npm install -g @expo/cli
   ```

2. **EAS CLI installed globally**
   ```bash
   npm install -g eas-cli
   ```

3. **Expo Account**
   - Sign up at https://expo.dev if you don't have an account
   - Login to your account

## Quick Start Commands

### 1. Login to Expo
```bash
eas login
```

### 2. Configure Project (if not already done)
```bash
cd mobile
eas build:configure
```

### 3. Build Android APK
```bash
# Build APK for internal distribution/testing
eas build --platform android --profile apk

# Alternative: Build using preview profile (also creates APK)
eas build --platform android --profile preview
```

### 4. Download APK
After the build completes:
- You'll receive a link to download the APK
- APK can be installed directly on Android devices
- Share the download link for testing

## Build Profiles Available

### 1. APK Profile (Recommended for testing)
- **Profile**: `apk`
- **Output**: APK file for direct installation
- **Use case**: Testing, sideloading, sharing with testers
- **Command**: `eas build --platform android --profile apk`

### 2. Preview Profile
- **Profile**: `preview`
- **Output**: APK file for internal distribution
- **Use case**: Development testing, internal sharing
- **Command**: `eas build --platform android --profile preview`

### 3. Production Profile
- **Profile**: `production`
- **Output**: AAB (Android App Bundle) for Play Store
- **Use case**: Google Play Store submission
- **Command**: `eas build --platform android --profile production`

## Android Configuration Details

### Package Information
- **Package Name**: `ai.calonik.app`
- **Version Code**: 1
- **Version Name**: 1.0.0

### Permissions
- **CAMERA**: For food image analysis
- **READ_EXTERNAL_STORAGE**: Access to photo library
- **WRITE_EXTERNAL_STORAGE**: Save analysis results

### Features
- Adaptive icon with Calonik branding
- Portrait orientation optimized
- Supports Android 5.0+ (API level 21+)

## Installation Instructions

### For Testing/Development
1. Download the APK from the EAS build link
2. On your Android device:
   - Go to Settings > Security
   - Enable "Unknown Sources" or "Install unknown apps"
3. Download and install the APK
4. Launch the Calonik app

### For Distribution
1. Share the EAS build download link
2. Recipients can download and install directly
3. No need for Google Play Store approval

## Troubleshooting

### Build Fails
```bash
# Clear cache and retry
eas build --platform android --profile apk --clear-cache
```

### Local Development
```bash
# Start development server
cd mobile
npm start

# Run on Android device/emulator
npm run android
```

### Check Build Status
```bash
# View build history
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

## Next Steps

### For Production Release
1. Build AAB for Play Store: `eas build --platform android --profile production`
2. Upload to Google Play Console
3. Complete store listing and review process

### For iOS Build
1. Build for App Store: `eas build --platform ios --profile production`
2. Submit to App Store Connect
3. Complete Apple review process

## Support
- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Expo Forums**: https://forums.expo.dev/
- **Build Troubleshooting**: https://docs.expo.dev/build-reference/troubleshooting/
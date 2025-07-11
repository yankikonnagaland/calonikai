# Quick APK Build Instructions - CONFLICT RESOLVED ✅

## iOS In-App Purchase Conflict Fixed
The iOS-only in-app purchase feature that was causing Android build conflicts has been resolved with platform-specific code separation.

## Fastest Way to Get Your Android APK

### Prerequisites
1. Create free Expo account at https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`

### Build Commands (Run from mobile directory)

```bash
# 1. Login to Expo
eas login

# 2. Build APK (takes 5-15 minutes)
eas build --platform android --profile apk

# 3. Download APK from the provided link
# 4. Install on Android device
```

### Alternative Quick Build
```bash
# Preview build (also creates APK)
eas build --platform android --profile preview
```

### Already Configured
- ✅ EAS configuration ready (eas.json)
- ✅ Android settings configured (app.json)
- ✅ Build profiles set up
- ✅ Package name: ai.calonik.app

### What You Get
- APK file for direct installation
- No Google Play Store needed
- Works on any Android 5.0+ device
- Can be shared via download link

### Next Steps After Build
1. Download APK from EAS build link
2. Enable "Unknown Sources" on Android device
3. Install APK directly
4. Test the Calonik app

### Build Status
Check build progress: `eas build:list`
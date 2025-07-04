# Local iOS Build Guide for Calonik

## Prerequisites
1. Node.js 18+ installed
2. Expo CLI and EAS CLI installed globally
3. Apple Developer Account (required for App Store submission)

## Step-by-Step Build Process

### 1. Download Project Files
Download the entire `mobile` folder to your local machine.

### 2. Install Dependencies
```bash
cd mobile
npm install
```

### 3. Install Global Tools (if not already installed)
```bash
npm install -g @expo/cli eas-cli
```

### 4. Authenticate with Expo
```bash
eas login
# Enter your Expo account credentials (yanpvuo)
```

### 5. Verify Project Configuration
```bash
eas project:info
# Should show project ID: 69fbe8d9-3226-4916-a01c-3ac66b4e8da7
```

### 6. Build for iOS App Store
```bash
eas build --platform ios --profile production
```

**Important Prompts During Build:**
- **Create EAS project?** → Answer: `y`
- **iOS Bundle Identifier?** → Answer: `ai.calonik.app`

## Troubleshooting React Native Crashes

If you encounter React Native crashes like "RCTFatal" or "non-std C++ exception", try these fixes:

### 1. Clear Cache
```bash
# Clear Expo cache
expo r -c

# Clear npm cache
npm cache clean --force
```

### 2. Reset Dependencies
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### 3. Check Expo SDK Version
```bash
# Ensure you're using compatible Expo SDK
expo install --fix
```

### 4. Reset Development Server
```bash
# Kill any running Metro bundlers
pkill -f "expo start"

# Restart with clean cache
expo start -c
```

### 5. If Building for iOS
```bash
# Clear iOS simulator
xcrun simctl erase all
```

The current configuration disables the new React Native architecture which should prevent most crashes.

### 7. Download Build Artifact
After successful build, download the .ipa file from the Expo dashboard.

## Current Configuration Files

### app.json (Ready for App Store)
- **Name**: "Calonik"
- **Bundle ID**: "ai.calonik.app"
- **Project ID**: "69fbe8d9-3226-4916-a01c-3ac66b4e8da7"
- **Version**: "1.0.0"

### eas.json (Minimal Production Config)
- **CLI Version**: ">= 3.0.0"
- **Distribution**: "store" (App Store ready)

## Troubleshooting

### If you get authentication errors:
1. Run `eas logout` then `eas login` again
2. Ensure you're logged in as "yanpvuo"

### If you get UUID errors:
The project ID is correctly configured in app.json. This error typically occurs due to authentication issues in cloud environments.

### Apple Developer Account Setup:
1. Enroll in Apple Developer Program ($99/year)
2. Create App Store Connect app with bundle ID: ai.calonik.app
3. Upload .ipa file through Xcode or App Store Connect

## Next Steps After Build
1. Test the .ipa file on physical iOS device
2. Submit for App Store review
3. Configure App Store listing (screenshots, description, etc.)

## Build Status
- ✅ Configuration files ready
- ✅ Project ID configured
- ✅ Bundle identifier set
- ⏳ Waiting for local authentication and build
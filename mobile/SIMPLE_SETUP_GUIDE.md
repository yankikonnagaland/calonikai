# Simple EAS Setup Guide for Calonik App Store Launch

## Prerequisites
1. Create an Expo account at [expo.dev](https://expo.dev)
2. Get Apple Developer Account ($99/year)

## Quick Setup Steps

### 1. Install EAS CLI (On Your Local Machine)
```bash
npm install -g eas-cli
```

### 2. Login to EAS
```bash
eas login
# Enter your Expo account credentials
```

### 3. Initialize Your Project
```bash
# Download this mobile folder to your local machine
# Navigate to the mobile directory
cd path/to/mobile

# Configure EAS build
eas build:configure
```

This will:
- Create a new Expo project
- Generate a unique project ID
- Update your app.json automatically

### 4. Update Your Apple Developer Info
After getting your Apple Developer account, update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id", 
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### 5. Build for App Store
```bash
# Build iOS app for App Store
eas build --platform ios --profile production
```

This creates an .ipa file ready for App Store submission.

### 6. Submit to App Store
```bash
# Direct submission to App Store
eas submit --platform ios
```

## Alternative: Manual Submission

If direct submission doesn't work:
1. Download the .ipa file from the EAS build
2. Upload to App Store Connect using:
   - Xcode Organizer
   - Apple's Transporter app
   - App Store Connect web interface

## Your Current Configuration Status

✅ **app.json** - Production ready with:
- Bundle ID: ai.calonik.app
- Camera permissions configured
- iOS build settings complete

✅ **eas.json** - Build profiles configured for:
- Development, preview, and production builds
- iOS resource allocation
- Submission settings (needs your Apple ID)

✅ **Assets** - App has:
- App icon placeholder
- Splash screen configured
- Adaptive icon for Android

## What You Need Next

### From Apple Developer Account:
- **Apple ID**: Your developer account email
- **Team ID**: Found in Apple Developer Portal
- **App Store Connect App ID**: Created when you add new app

### From App Store Connect:
1. Create new app with bundle ID: ai.calonik.app
2. Set up In-App Purchase products:
   - ai.calonik.app.basic_monthly (₹99)
   - ai.calonik.app.premium_monthly (₹399)
3. Prepare store listing with screenshots and description

## Expected Timeline
- **EAS Setup**: 30 minutes
- **First Build**: 10-15 minutes  
- **App Store Connect Setup**: 2-3 hours
- **Review Process**: 1-7 days

## Common Issues & Solutions

**Build Fails:**
- Check bundle identifier matches Apple Developer account
- Ensure all required certificates are available
- Verify app.json configuration

**Submission Rejected:**
- Must use Apple In-App Purchase for subscriptions
- Need proper usage descriptions for camera/photos
- Follow App Store Review Guidelines

**Getting Help:**
- EAS Documentation: docs.expo.dev/build/introduction
- Apple Developer Support: developer.apple.com/support
- Expo Community: forums.expo.dev

---

**Ready to start?** The mobile app code is complete and configured. You just need to run these setup commands with your Expo and Apple Developer accounts.
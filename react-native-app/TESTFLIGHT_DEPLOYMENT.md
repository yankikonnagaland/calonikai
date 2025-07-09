# TestFlight Deployment Guide for Calonik AI

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Complete enrollment process

2. **App Store Connect Setup**
   - Create new app in App Store Connect
   - Set bundle ID: `ai.calonik.app` 
   - Note down your App Store Connect App ID

3. **Local Development Setup**
   - Install EAS CLI: `npm install -g @expo/eas-cli`
   - Install Xcode (macOS only)

## Step-by-Step TestFlight Deployment

### Step 1: Configure Your Apple Developer Information

Update `eas.json` with your Apple Developer details:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id", 
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### Step 2: Build for iOS Production

```bash
# Navigate to react-native-app directory
cd react-native-app

# Login to EAS (one-time setup)
eas login

# Build for iOS TestFlight
eas build --platform ios --profile production
```

### Step 3: Submit to TestFlight

```bash
# Submit the build to App Store Connect
eas submit --platform ios --profile production
```

### Step 4: TestFlight Setup in App Store Connect

1. Go to App Store Connect (https://appstoreconnect.apple.com)
2. Navigate to your app
3. Go to TestFlight section
4. Add internal testers (up to 100 people)
5. Add external testers (requires App Review, up to 10,000 people)

## Alternative: Manual Upload

If you prefer manual upload:

1. Download the `.ipa` file from EAS build dashboard
2. Use Xcode or Transporter app to upload to App Store Connect
3. Process the build in TestFlight section

## File Structure for TestFlight

The React Native app includes:

```
react-native-app/
├── App.js                 # Main app entry point
├── app.json              # Expo configuration
├── eas.json              # EAS build configuration  
├── package.json          # Dependencies
├── assets/               # App icons and splash screens
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens (Tracker, Profile, etc.)
│   ├── context/          # React Context for state management
│   ├── services/         # API and data services
│   └── utils/            # Helper functions
```

## Key Features Included

✅ **Food Tracker** - Search and log meals with calorie tracking
✅ **AI Camera** - Take photos of food for automatic nutrition analysis  
✅ **Profile & Goals** - BMR/TDEE calculator with weight goals
✅ **Exercise Tracker** - Log workouts with calorie burn calculations
✅ **Dashboard Analytics** - Charts showing nutrition trends and progress
✅ **Local Storage** - AsyncStorage for offline data persistence
✅ **Native Navigation** - React Navigation with bottom tabs

## App Store Metadata

**App Name:** Calonik AI
**Bundle ID:** ai.calonik.app
**Version:** 1.0.0
**Category:** Health & Fitness
**Description:** AI-powered calorie and nutrition tracker with smart food recognition

## Support & Updates

- Contact: support@calonik.ai
- Update frequency: Bi-weekly releases
- TestFlight builds expire after 90 days

## Troubleshooting

**Build Fails:**
- Check bundle identifier matches App Store Connect
- Verify Apple Developer account permissions
- Ensure all required certificates are valid

**Upload Fails:**
- Check Apple ID and Team ID in eas.json
- Verify app exists in App Store Connect
- Ensure build architecture matches device requirements

**TestFlight Not Available:**
- Build must complete App Store processing (5-30 minutes)
- Check for compliance and App Review requirements
- Verify test device compatibility
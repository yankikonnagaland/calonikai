# EAS Configuration and iOS Build Setup Guide

## Prerequisites

### 1. Apple Developer Account
- Sign up at [developer.apple.com](https://developer.apple.com) ($99/year)
- Complete team setup and agreements
- Note your Team ID and Apple ID

### 2. Expo Account
- Create account at [expo.dev](https://expo.dev)
- Install EAS CLI globally

### 3. Development Environment
- macOS for iOS builds (optional with EAS cloud builds)
- Xcode (latest version)
- Node.js 18+

## Step-by-Step Setup

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Initialize EAS Project
```bash
cd mobile
eas init
```
This will:
- Create/update your `app.json` with a project ID
- Link to your Expo account
- Generate initial `eas.json` configuration

### 4. Update Configuration Files

#### Update `app.json` with your details:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    },
    "owner": "your-expo-username"
  }
}
```

#### Update `eas.json` for your Apple Developer account:
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

### 5. Create App Assets
Create the following assets in `mobile/assets/`:
- `icon.png` (1024x1024px)
- `splash.png` (1284x2778px)
- `adaptive-icon.png` (1024x1024px)
- `favicon.png` (32x32px)

### 6. Configure Apple App Store Connect

#### Create App Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app details:
   - **Name**: Calonik - AI Calorie Tracker
   - **Bundle ID**: ai.calonik.app
   - **SKU**: calonik-ios-app
   - **User Access**: Full Access

#### App Information
- **Category**: Health & Fitness
- **Subcategory**: Diet & Nutrition
- **Content Rights**: Your app does not use third-party content
- **Age Rating**: 4+ (No objectionable content)

### 7. Build the iOS App

#### Development Build
```bash
eas build --platform ios --profile development
```

#### Preview Build (for TestFlight)
```bash
eas build --platform ios --profile preview
```

#### Production Build
```bash
eas build --platform ios --profile production
```

### 8. Submit to App Store

#### Upload to TestFlight
```bash
eas submit --platform ios
```

#### Manual Upload (Alternative)
1. Download the `.ipa` file from EAS build
2. Use Xcode → Window → Organizer
3. Upload to App Store Connect

## Build Profiles Explained

### Development Profile
- **Purpose**: Internal testing on registered devices
- **Distribution**: Internal only
- **Features**: Development client enabled
- **Use Case**: Team testing and debugging

### Preview Profile  
- **Purpose**: TestFlight beta testing
- **Distribution**: Internal TestFlight
- **Features**: Production-like build
- **Use Case**: Beta testing with external users

### Production Profile
- **Purpose**: App Store release
- **Distribution**: App Store
- **Features**: Optimized, signed build
- **Use Case**: Public app store distribution

## Common Issues and Solutions

### 1. Bundle Identifier Conflicts
```bash
# Ensure unique bundle ID in app.json
"bundleIdentifier": "ai.calonik.app"
```

### 2. Missing Provisioning Profile
- Check Apple Developer account
- Ensure device UDIDs are registered
- Verify app ID configuration

### 3. Asset Size Issues
- Ensure icon.png is exactly 1024x1024px
- Check splash.png dimensions
- Verify file formats (PNG recommended)

### 4. Build Failures
```bash
# Check build logs
eas build:list

# View specific build
eas build:view [build-id]
```

## Environment Variables

### Production API Configuration
Update the mobile app to use production backend:
```javascript
// In src/services/api.ts
const API_BASE_URL = 'https://calonik.ai/api'; // Update when domain is ready
```

### Secure Configuration
Store sensitive data in EAS secrets:
```bash
eas secret:create --scope project --name API_URL --value "https://your-api-url.com"
```

## TestFlight Distribution

### 1. Internal Testing
- Add team members via App Store Connect
- Automatic distribution after upload
- No review required

### 2. External Testing
- Add external testers (up to 10,000)
- Requires Beta App Review
- 1-3 day review process

## App Store Review Guidelines

### Key Requirements
- **Functionality**: App must work as described
- **Content**: Health disclaimers required
- **Privacy**: Data collection must be disclosed
- **Performance**: No crashes or bugs
- **Design**: Follow Human Interface Guidelines

### Health App Specific Requirements
- Clear explanation of health data usage
- Appropriate disclaimers about medical advice
- User consent for data sharing
- Privacy policy compliance

## Monitoring and Analytics

### Build Status
```bash
# Monitor builds
eas build:list --limit 10

# Cancel running build
eas build:cancel [build-id]
```

### App Store Analytics
- Monitor via App Store Connect
- Track downloads and revenue
- Review user feedback and ratings

## Automated Workflows

### GitHub Actions Integration
```yaml
# .github/workflows/eas-build.yml
name: EAS Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @expo/eas-cli
      - run: eas build --platform ios --non-interactive
```

## Cost Estimation

### EAS Build Credits
- **Free tier**: 30 builds/month
- **Production plan**: $29/month for unlimited builds
- **Priority builds**: Faster queue processing

### Apple Developer Costs
- **Developer Program**: $99/year
- **App Store**: No per-download fees
- **In-App Purchases**: 30% App Store commission

## Next Steps After Configuration

1. **Create Assets**: Design app icon and splash screen
2. **Test Build**: Run development build first
3. **Beta Test**: Use TestFlight for team testing  
4. **Submit Review**: Prepare App Store submission
5. **Marketing**: App Store optimization and promotion

## Support Resources

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Guide**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- **Apple Documentation**: [developer.apple.com/documentation](https://developer.apple.com/documentation)
- **App Store Guidelines**: [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines)
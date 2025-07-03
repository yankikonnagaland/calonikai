# Quick EAS Commands for Calonik Mobile

## Initial Setup
```bash
# Run the setup script
./setup-eas.sh

# Or manual setup:
npm install -g @expo/eas-cli
eas login
eas init --id
npm install
```

## Building

### iOS Builds
```bash
# Development build (for testing on registered devices)
npm run build:ios
# or
eas build --platform ios --profile development

# Preview build (for TestFlight beta)
npm run preview:ios
# or
eas build --platform ios --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
```

### Android Builds
```bash
# Development build
npm run build:android

# Preview build
npm run preview:android

# Production build
eas build --platform android --profile production
```

### All Platforms
```bash
npm run build:all
# or
eas build --platform all
```

## Development

### Local Development
```bash
# Start Expo dev server
npm start

# Start on iOS simulator
npm run ios

# Start on Android emulator
npm run android

# Start web version
npm run web
```

### Device Testing
```bash
# Install Expo Go app on your phone
# Scan QR code from 'npm start'
# Or use development build on registered device
```

## Submission

### iOS App Store
```bash
# Submit to App Store Connect
npm run submit:ios
# or
eas submit --platform ios

# Check submission status
eas submission:list --platform ios
```

### Google Play Store
```bash
# Submit to Google Play
npm run submit:android
# or
eas submit --platform android
```

## Monitoring

### Build Status
```bash
# List recent builds
eas build:list

# View specific build details
eas build:view [build-id]

# Cancel running build
eas build:cancel [build-id]

# View build logs
eas build:view [build-id] --logs
```

### Project Info
```bash
# Check current user
eas whoami

# View project details
eas project:info

# List project collaborators
eas project:list
```

## Debugging

### Common Issues
```bash
# Clear Expo cache
expo r -c

# Reset Metro bundler cache
npx react-native start --reset-cache

# Check EAS configuration
eas config

# Validate app.json
expo config --type public
```

### Build Troubleshooting
```bash
# View detailed build logs
eas build:view [build-id] --logs

# Check build artifacts
eas build:list --limit 10

# Download build artifact
eas build:view [build-id] --download
```

## Configuration

### Update App Configuration
```bash
# Edit app.json for app settings
# Edit eas.json for build profiles
# Edit package.json for dependencies
```

### Environment Variables
```bash
# Set project secrets
eas secret:create --scope project --name API_URL --value "https://api.calonik.ai"

# List project secrets
eas secret:list --scope project

# Delete secret
eas secret:delete --scope project --name SECRET_NAME
```

## Asset Management

### Required Assets
- `assets/icon.png` (1024x1024px)
- `assets/splash.png` (1284x2778px) 
- `assets/adaptive-icon.png` (1024x1024px)
- `assets/favicon.png` (32x32px)

### Asset Validation
```bash
# Check asset requirements
expo config --type public | grep -A 10 "icon\|splash"
```

## Apple Developer Setup

### Required Information
- Apple ID email
- Team ID (from Apple Developer account)
- App Store Connect App ID
- Bundle identifier: `ai.calonik.app`

### App Store Connect
1. Create app record
2. Set up app information
3. Configure In-App Purchases (if needed)
4. Prepare metadata and screenshots

## Ready-to-Run Commands

After completing setup, you can immediately run:

```bash
# Start development
npm start

# Build for TestFlight
npm run preview:ios

# Build for App Store (when ready)
eas build --platform ios --profile production

# Submit to App Store (after successful build)
eas submit --platform ios
```

## Support

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Expo Discord**: https://chat.expo.dev/
- **Stack Overflow**: Tag questions with `expo` and `eas`
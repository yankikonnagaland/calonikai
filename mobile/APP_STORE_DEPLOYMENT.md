# App Store Deployment Guide for Calonik Mobile App

## Prerequisites

### Apple Developer Account
- Sign up for Apple Developer Program ($99/year)
- Complete team setup and developer agreements
- Enable App Store Connect access

### Google Play Developer Account
- Register Google Play Console account ($25 one-time)
- Complete developer verification
- Set up merchant account for subscriptions

## iOS App Store Deployment

### 1. App Configuration
Update `app.json`:
```json
{
  "expo": {
    "name": "Calonik - Calorie Tracker",
    "slug": "calonik-calorie-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ai.calonik.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Calonik uses camera to analyze food images for nutrition tracking",
        "NSPhotoLibraryUsageDescription": "Calonik accesses photo library to analyze food images",
        "NSHealthShareUsageDescription": "Calonik can sync with Health app to share nutrition data",
        "NSHealthUpdateUsageDescription": "Calonik can update Health app with your nutrition progress"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "ai.calonik.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### 2. App Store Requirements

#### Required Assets
- App Icon (1024x1024px)
- iPhone Screenshots (6.7", 6.5", 5.5", 4.7")
- iPad Screenshots (if supporting)
- App Preview Videos (optional but recommended)

#### App Store Information
- **App Name**: Calonik - AI Calorie Tracker
- **Subtitle**: Smart nutrition tracking with AI
- **Keywords**: calorie tracker, nutrition, diet, health, fitness, weight loss, food scanner
- **Category**: Health & Fitness
- **Content Rating**: 4+ (No objectionable content)

#### App Description
```
Calonik is an AI-powered nutrition tracking app that makes calorie counting effortless. 

KEY FEATURES:
• AI Food Scanner - Point your camera at any food and get instant nutrition info
• Smart Portion Detection - Automatically estimates serving sizes
• Comprehensive Food Database - Thousands of foods with accurate nutrition data
• Personal Nutrition Goals - BMR/TDEE calculation with custom targets
• Exercise Tracking - Log workouts with built-in timer
• Progress Dashboard - Visual insights into your nutrition journey

SUBSCRIPTION PLANS:
• Basic Plan (₹99/month) - Limited AI scans, basic tracking
• Premium Plan (₹399/month) - Unlimited features, enhanced analytics

Transform your health journey with intelligent nutrition tracking. Download now!
```

### 3. Apple In-App Purchase Setup

#### Replace Razorpay with Apple IAP
```javascript
// For iOS, replace subscription system
import { requestPurchase, getProducts } from 'react-native-iap';

const productIds = [
  'ai.calonik.app.basic_monthly',
  'ai.calonik.app.premium_monthly'
];

// Purchase flow
const purchaseSubscription = async (productId) => {
  try {
    await requestPurchase(productId);
    // Verify receipt with backend
    // Activate subscription
  } catch (error) {
    console.error('Purchase failed:', error);
  }
};
```

#### Configure App Store Connect
1. Create In-App Purchase products
2. Set up subscription groups
3. Configure pricing tiers
4. Add localized descriptions
5. Submit for review

### 4. Build and Submit

#### Using EAS Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

#### Manual Build Process
```bash
# Build iOS app bundle
expo build:ios --type archive

# Download .ipa file from Expo
# Upload to App Store Connect via Xcode or Transporter
```

## Google Play Store Deployment

### 1. Android Configuration

#### Update app.json for Android
```json
{
  "android": {
    "versionCode": 1,
    "package": "ai.calonik.app",
    "permissions": [
      "CAMERA",
      "READ_EXTERNAL_STORAGE"
    ],
    "usesCleartextTraffic": false,
    "allowBackup": false
  }
}
```

### 2. Google Play Billing Setup

#### Replace Razorpay with Google Play Billing
```javascript
// For Android, use Google Play Billing
import { 
  initConnection,
  purchaseUpdatedListener,
  requestPurchase
} from 'react-native-iap';

const androidProductIds = [
  'basic_monthly_subscription',
  'premium_monthly_subscription'
];
```

### 3. Play Console Setup

#### Store Listing
- **Title**: Calonik - AI Calorie Tracker
- **Short Description**: Smart nutrition tracking with AI food scanner
- **Full Description**: Same as iOS with Android-specific features
- **Category**: Health & Fitness
- **Content Rating**: Everyone
- **Target Audience**: Adults interested in health and fitness

#### Required Assets
- App Icon (512x512px)
- Feature Graphic (1024x500px)
- Phone Screenshots (minimum 2)
- Tablet Screenshots (if supporting)

### 4. Build and Release

```bash
# Build Android App Bundle
eas build --platform android --profile production

# Or build APK
expo build:android --type app-bundle

# Upload to Play Console
# Complete store listing
# Submit for review
```

## Pre-Launch Checklist

### Technical Requirements
- [ ] App builds successfully for both iOS and Android
- [ ] All permissions properly declared
- [ ] Camera functionality tested on devices
- [ ] API endpoints secured with HTTPS
- [ ] Subscription system integrated (IAP/Google Play)
- [ ] Offline functionality handles network errors gracefully

### Legal Requirements
- [ ] Privacy Policy updated for mobile app
- [ ] Terms of Service include mobile-specific terms
- [ ] Age rating appropriate for all regions
- [ ] Data collection practices clearly documented
- [ ] GDPR compliance for EU users

### Testing Requirements
- [ ] Internal testing completed
- [ ] Beta testing with TestFlight/Internal Testing
- [ ] Performance testing on various devices
- [ ] Subscription flows tested end-to-end
- [ ] Accessibility testing completed

### Content Requirements
- [ ] All screenshots updated and accurate
- [ ] App descriptions reviewed and optimized
- [ ] Keywords researched for ASO (App Store Optimization)
- [ ] Feature graphics designed and uploaded
- [ ] App icon follows platform guidelines

## Post-Launch Monitoring

### Analytics Setup
- Integrate Firebase Analytics
- Track key user actions
- Monitor subscription conversion rates
- Set up crash reporting

### User Feedback
- Respond to app store reviews
- Monitor support channels
- Collect user feedback for improvements
- Plan iterative updates

### Performance Monitoring
- Monitor app crashes and errors
- Track API performance and usage
- Monitor subscription metrics
- Plan capacity scaling

## Estimated Timeline

### Development Phase (Completed)
- ✅ Mobile app structure and screens
- ✅ API integration and data layer
- ✅ UI/UX design implementation

### Deployment Phase (2-3 weeks)
- Week 1: App Store assets, descriptions, IAP setup
- Week 2: Build submission, review preparation
- Week 3: Review process, launch preparation

### Post-Launch Phase (Ongoing)
- Monitor performance and user feedback
- Iterate based on app store metrics
- Plan feature updates and improvements

## Support Resources

### Apple Developer Documentation
- App Store Review Guidelines
- Human Interface Guidelines
- In-App Purchase Programming Guide

### Google Play Documentation
- Play Console Help Center
- Android Design Guidelines
- Google Play Billing Library

### Expo Documentation
- EAS Build and Submit
- App Store Deployment
- Configuration with app.json
# Complete App Store Release Guide for Calonik

Your Calonik app is ready for App Store submission! Follow these steps to get your app published.

## Status: ✅ App Ready for Release

Your mobile app has all the necessary components:
- ✅ Expo/React Native app configured
- ✅ EAS build system ready  
- ✅ Camera permissions properly set
- ✅ Bundle identifier: ai.calonik.app
- ✅ App icons and branding configured

## Step 1: Apple Developer Account Setup

### 1.1 Sign Up for Apple Developer Program
1. Go to [developer.apple.com](https://developer.apple.com/programs/)
2. Enroll in Apple Developer Program ($99/year)
3. Complete identity verification (may take 24-48 hours)
4. Accept developer agreements

### 1.2 Set Up App Store Connect
1. Sign in to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to "My Apps" and click the "+" button
3. Create new app:
   - **Platform**: iOS
   - **Name**: Calonik - AI Calorie Tracker
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: ai.calonik.app (will appear after first build)
   - **SKU**: calonik-ios-v1

## Step 2: Install EAS CLI and Build

### 2.1 Install EAS Command Line Tools
```bash
# Install EAS CLI globally (correct package name)
npm install -g eas-cli

# Navigate to your mobile app directory
cd mobile

# Login to your Expo account
eas login
```

### 2.2 Configure EAS Build
```bash
# Initialize EAS configuration
eas build:configure

# Select iOS platform when prompted
# Choose "production" build profile
```

### 2.3 Update EAS Configuration
Edit `mobile/eas.json` with your Apple Developer details:
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
      "distribution": "internal"
    },
    "production": {
      "distribution": "store",
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
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

## Step 3: Create App Store Build

### 3.1 Build iOS App for App Store
```bash
# Create production build for App Store
eas build --platform ios --profile production

# This will:
# - Upload your code to Expo's build servers
# - Compile your app for iOS
# - Generate an .ipa file ready for App Store submission
# - Process usually takes 10-20 minutes
```

### 3.2 Download Build
After successful build:
1. EAS will provide a download link
2. Download the .ipa file to your computer
3. Keep this file - you'll upload it to App Store Connect

## Step 4: App Store Connect Setup

### 4.1 App Information
Fill out these required sections in App Store Connect:

**App Information:**
- Name: Calonik - AI Calorie Tracker
- Subtitle: Smart nutrition tracking with AI
- Category: Health & Fitness
- Content Rights: No

**Pricing and Availability:**
- Price: Free (with in-app purchases)
- Availability: All countries/regions

### 4.2 App Privacy
Required privacy information:
```
Data Collection: YES
- Contact Info: Email addresses (for account creation)
- Health & Fitness: Dietary data, fitness data (for nutrition tracking)
- Usage Data: App interactions (for app improvement)

Third-party tracking: NO
```

### 4.3 In-App Purchases (Critical for Revenue)
Create subscription products:

**Basic Subscription:**
- Product ID: `ai.calonik.app.basic_monthly`
- Type: Auto-Renewable Subscription
- Duration: 1 Month
- Price: ₹99

**Premium Subscription:**
- Product ID: `ai.calonik.app.premium_monthly`  
- Type: Auto-Renewable Subscription
- Duration: 1 Month
- Price: ₹399

## Step 5: Upload App Binary

### 5.1 Using EAS Submit (Recommended)
```bash
# Direct submission to App Store
eas submit --platform ios --profile production

# Enter your Apple ID and app-specific password when prompted
```

### 5.2 Alternative: Upload via Xcode/Transporter
1. Download Transporter app from Mac App Store
2. Drag your .ipa file into Transporter
3. Deliver to App Store Connect

## Step 6: App Store Listing

### 6.1 App Store Screenshots (Required)
You need screenshots for:
- iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796 pixels
- iPhone 6.5" (iPhone 14 Plus): 1242 x 2688 pixels
- iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 pixels

**Screenshot Ideas:**
1. Food camera scanning a meal
2. Dashboard showing nutrition progress
3. Food search results
4. Exercise tracking interface
5. Profile setup screen

### 6.2 App Description
```
Transform your nutrition journey with Calonik's AI-powered calorie tracking.

KEY FEATURES:
• AI Food Scanner - Point camera at food for instant nutrition info
• Smart Portion Detection - Automatic serving size estimation
• Comprehensive Food Database - Thousands of accurate nutrition entries
• Personal Goals - BMR/TDEE calculation with custom targets
• Exercise Tracking - Built-in workout timer and calorie burn
• Progress Dashboard - Visual insights into your health journey

SUBSCRIPTION PLANS:
• Basic Plan (₹99/month) - Essential tracking features  
• Premium Plan (₹399/month) - Unlimited AI scans & analytics

Start your smart nutrition journey today!
```

### 6.3 Keywords
```
calorie tracker, nutrition, diet, health, fitness, weight loss, food scanner, AI, meal tracker, exercise
```

## Step 7: Submit for Review

### 7.1 Pre-Submission Checklist
- [ ] App binary uploaded successfully
- [ ] All required screenshots added
- [ ] App description completed
- [ ] Privacy policy URL provided
- [ ] Support URL provided
- [ ] In-app purchases configured
- [ ] Content rating completed

### 7.2 Submit for Review
1. Click "Add for Review" in App Store Connect
2. Fill out export compliance questionnaire
3. Submit for Apple review

## Step 8: Review Process

### 8.1 Review Timeline
- Initial review: 24-48 hours
- Full review: 7 days maximum
- Common review time: 1-3 days

### 8.2 Common Rejection Reasons & Solutions
**Camera Permission Issue:**
- Solution: Your app.json already includes proper camera usage descriptions

**Subscription Implementation:**
- Solution: Must implement Apple's In-App Purchase system (not Razorpay)

**Missing Privacy Policy:**
- Solution: Add privacy policy URL to App Store Connect

## Step 9: Launch Preparation

### 9.1 Pre-Launch Marketing
- Prepare press release
- Update website with App Store link
- Create social media content
- Reach out to health/fitness bloggers

### 9.2 Launch Day Checklist
- [ ] App approved and ready for release
- [ ] Press release distributed
- [ ] Social media posts scheduled
- [ ] Website updated with download links
- [ ] Customer support team briefed

## Step 10: Post-Launch Monitoring

### 10.1 Key Metrics to Track
- Download numbers
- Subscription conversion rates
- User retention (Day 1, 7, 30)
- App Store ratings and reviews
- Revenue from subscriptions

### 10.2 Ongoing Maintenance
- Respond to user reviews
- Monitor crash reports
- Plan feature updates
- Optimize based on user feedback

## Support Resources

### Apple Documentation
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [In-App Purchase Programming Guide](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

### Expo/EAS Documentation
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Deployment Guide](https://docs.expo.dev/distribution/app-stores/)

---

## Next Immediate Steps

1. **Sign up for Apple Developer Program** (if not done already)
2. **Install EAS CLI**: `npm install -g @expo/eas-cli`
3. **Run your first build**: `cd mobile && eas build --platform ios --profile production`

Your app is technically ready to go live! The main work now is administrative setup with Apple and creating marketing materials.
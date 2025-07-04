# App Store Launch Checklist for Calonik

## 🚀 Ready to Launch Status
✅ Mobile app code complete  
✅ EAS build configuration ready  
✅ App.json properly configured  
✅ Camera permissions and plugins set up  
✅ Bundle identifier: ai.calonik.app  

## Required Next Steps

### 1. Apple Developer Account (Required)
- [ ] Sign up for Apple Developer Program ($99/year)
- [ ] Complete team verification process
- [ ] Get Apple Team ID from Developer Portal

### 2. EAS Project Setup
```bash
# In the mobile directory, run:
cd mobile
npm install -g @expo/eas-cli
eas login
eas build:configure
```

### 3. Update EAS Configuration
Replace placeholder values in `eas.json`:
- `your-apple-id@example.com` → Your Apple ID
- `your-team-id` → Your Apple Team ID  
- `placeholder-app-store-connect-id` → Your App Store Connect App ID

### 4. Build for App Store
```bash
# Production iOS build
eas build --platform ios --profile production

# This will generate an .ipa file ready for App Store
```

### 5. Submit to App Store
```bash
# Direct submission through EAS
eas submit --platform ios

# Or download .ipa and upload via App Store Connect
```

## App Store Assets Needed

### Required Screenshots
- iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796 pixels
- iPhone 6.5" (iPhone 14 Plus): 1242 x 2688 pixels  
- iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 pixels

### App Information
- **App Name**: Calonik - AI Calorie Tracker
- **Subtitle**: Smart nutrition tracking with AI
- **Category**: Health & Fitness
- **Content Rating**: 4+ (Safe for all ages)
- **Keywords**: calorie tracker, nutrition, diet, health, AI, food scanner

### App Description (Ready to use)
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

## Subscription Integration (Critical)

### Replace Web Payments with Apple In-App Purchases
Your current Razorpay integration won't work on iOS. Apple requires their IAP system:

```javascript
// Install react-native-iap for iOS subscriptions
npm install react-native-iap

// Configure subscription products in App Store Connect:
// Product IDs: 
// - ai.calonik.app.basic_monthly (₹99/month)
// - ai.calonik.app.premium_monthly (₹399/month)
```

## Estimated Timeline

### Week 1: Setup & Assets
- Apple Developer account approval
- App Store Connect setup
- Screenshot creation
- Store listing preparation

### Week 2: Build & Test  
- EAS build configuration
- TestFlight beta testing
- Subscription flow testing
- Final bug fixes

### Week 3: Submit & Launch
- App Store submission
- Review process (1-7 days)
- Launch day coordination
- Post-launch monitoring

## Success Metrics to Track
- Download rates
- Subscription conversion rates  
- User retention (Day 1, Day 7, Day 30)
- App Store rating and reviews
- Revenue from subscriptions

## Support After Launch
- Monitor crash reports and user feedback
- Respond to App Store reviews promptly
- Plan regular updates with new features
- Optimize based on user behavior analytics

---

**Ready to start?** The first step is getting your Apple Developer account. Once you have that, we can complete the EAS setup and build your first App Store-ready version!
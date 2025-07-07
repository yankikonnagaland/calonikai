# Apple In-App Purchase Setup Guide for Calonik.ai

## Overview
This guide walks you through setting up iOS In-App Purchases for Calonik.ai mobile app, including App Store Connect configuration, StoreKit testing, and production deployment.

## Prerequisites
- Apple Developer Account ($99/year)
- Completed mobile app with iOS entitlements
- Product IDs defined in your app code

## Step 1: App Store Connect Setup

### 1.1 Create App Record
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to "My Apps" → "+" → "New App"
3. Fill in app details:
   - **Platform**: iOS
   - **Name**: Calonik - AI Calorie Tracker
   - **Primary Language**: English
   - **Bundle ID**: ai.calonik.app (must match app.json)
   - **SKU**: calonik-ios-2025

### 1.2 Configure In-App Purchase Products
1. In your app record, go to "Features" → "In-App Purchases"
2. Click "+" to create new products

#### Basic Monthly Subscription
- **Type**: Auto-Renewable Subscription
- **Reference Name**: Calonik Basic Monthly
- **Product ID**: `ai.calonik.basic.monthly`
- **Subscription Group**: Calonik Subscriptions
- **Subscription Duration**: 1 Month
- **Price**: $1.99 (or regional equivalent)

#### Premium Monthly Subscription  
- **Type**: Auto-Renewable Subscription
- **Reference Name**: Calonik Premium Monthly
- **Product ID**: `ai.calonik.premium.monthly`
- **Subscription Group**: Calonik Subscriptions
- **Subscription Duration**: 1 Month
- **Price**: $6.99 (or regional equivalent)

### 1.3 Subscription Group Configuration
1. Create subscription group "Calonik Subscriptions"
2. Set up subscription levels:
   - **Level 1**: Basic ($1.99/month)
   - **Level 2**: Premium ($6.99/month)
3. Enable family sharing if desired

## Step 2: App Information & Metadata

### 2.1 App Information
- **App Store Icon**: 1024x1024 PNG (use mobile/assets/icon.png)
- **Category**: Health & Fitness
- **Content Rights**: Does not contain third-party content

### 2.2 Subscription Details
For each subscription, provide:
- **Display Name**: "Basic Plan" / "Premium Plan"
- **Description**: Feature descriptions matching your app
- **Screenshot**: Optional promotional images

#### Basic Plan Description:
```
• 100 food searches daily
• Limited AI photo scans
• Basic nutrition tracking
• Standard exercise logging
• Email support
```

#### Premium Plan Description:
```
• 200+ food searches daily
• 5+ AI photo scans daily
• Enhanced exercise tracking
• Complete health analytics
• Goal progress tracking
• Priority support
```

## Step 3: Shared Secret Configuration

### 3.1 Generate App-Specific Shared Secret
1. In App Store Connect → "My Apps" → Your App
2. Go to "App Information" → "App-Specific Shared Secret"
3. Click "Generate" and copy the secret
4. Add to your environment variables as `APPLE_SHARED_SECRET`

### 3.2 Environment Variables
Add these to your production environment:
```bash
APPLE_SHARED_SECRET=your_app_specific_shared_secret_here
NODE_ENV=production  # Uses production Apple servers
```

## Step 4: StoreKit Testing (Development)

### 4.1 Sandbox Tester Accounts
1. App Store Connect → "Users and Access" → "Sandbox Testers"
2. Create test accounts for different regions
3. Use these accounts in iOS Simulator for testing

### 4.2 StoreKit Configuration File
Create `mobile/Calonik.storekit` for local testing:
```json
{
  "identifier": "D85E1B24",
  "nonRenewingSubscriptions": [],
  "products": [],
  "settings": {
    "_applicationInternalID": "123456789",
    "_developerTeamID": "YOUR_TEAM_ID",
    "_failTransactionsEnabled": false,
    "_lastSynchronizedDate": "2025-07-06T15:17:00.000Z",
    "_locale": "en_US",
    "_storefront": "USA",
    "_storeKitErrors": []
  },
  "subscriptionGroups": [
    {
      "id": "12345678",
      "localizations": [],
      "name": "Calonik Subscriptions",
      "subscriptions": [
        {
          "adHocOffers": [],
          "codeOffers": [],
          "displayPrice": "1.99",
          "familyShareable": false,
          "id": "ai.calonik.basic.monthly",
          "internalID": "987654321",
          "introductoryOffer": null,
          "localizations": [
            {
              "description": "Basic nutrition tracking features",
              "displayName": "Basic Plan",
              "locale": "en_US"
            }
          ],
          "productID": "ai.calonik.basic.monthly",
          "recurringSubscriptionPeriod": "P1M",
          "referenceName": "Calonik Basic Monthly",
          "subscriptionGroupID": "12345678",
          "type": "RecurringSubscription"
        },
        {
          "adHocOffers": [],
          "codeOffers": [],
          "displayPrice": "6.99",
          "familyShareable": false,
          "id": "ai.calonik.premium.monthly",
          "internalID": "987654322",
          "introductoryOffer": null,
          "localizations": [
            {
              "description": "Premium nutrition tracking with AI features",
              "displayName": "Premium Plan",
              "locale": "en_US"
            }
          ],
          "productID": "ai.calonik.premium.monthly",
          "recurringSubscriptionPeriod": "P1M",
          "referenceName": "Calonik Premium Monthly",
          "subscriptionGroupID": "12345678",
          "type": "RecurringSubscription"
        }
      ]
    }
  ],
  "version": {
    "major": 2,
    "minor": 0
  }
}
```

## Step 5: Build & Submit Process

### 5.1 EAS Build with IAP
```bash
# Install expo-in-app-purchases when dependency issues are resolved
npm install expo-in-app-purchases

# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

### 5.2 TestFlight Testing
1. Upload build to TestFlight
2. Add internal testers
3. Test subscription flow with sandbox accounts
4. Verify receipt validation with your backend

### 5.3 App Review Preparation
Ensure your app includes:
- Clear subscription terms and pricing
- Easy cancellation instructions
- Restore purchases functionality
- Proper error handling for purchase failures

## Step 6: Production Launch

### 6.1 Pre-Launch Checklist
- [ ] All subscription products approved in App Store Connect
- [ ] Shared secret configured in production environment
- [ ] Backend receipt validation tested
- [ ] Restore purchases functionality working
- [ ] App review guidelines compliance verified

### 6.2 Post-Launch Monitoring
Monitor these metrics:
- Subscription conversion rates
- Failed transactions
- Receipt validation errors
- Customer support requests

## Step 7: Backend Integration Verification

### 7.1 Test Receipt Validation
```bash
# Test sandbox receipt validation
curl -X POST https://your-app.replit.dev/api/ios-verify-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "receiptData": "sandbox_receipt_data",
    "productId": "ai.calonik.basic.monthly", 
    "transactionId": "test_transaction_id",
    "userId": "test_user_123"
  }'
```

### 7.2 Test Subscription Activation
```bash
# Test subscription activation
curl -X POST https://your-app.replit.dev/api/activate-ios-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "subscriptionPlan": "basic",
    "transactionId": "test_transaction_id",
    "productId": "ai.calonik.basic.monthly"
  }'
```

## Important Notes

### Security Considerations
1. Always validate receipts server-side
2. Use app-specific shared secret
3. Handle subscription status changes via App Store Server Notifications
4. Implement proper error handling for edge cases

### App Store Guidelines
1. Clearly display subscription terms and pricing
2. Provide easy access to cancellation
3. Implement restore purchases functionality
4. Handle subscription upgrades/downgrades gracefully

### Testing Scenarios
Test these key flows:
- New subscription purchase
- Restore previous purchases
- Subscription renewal
- Subscription cancellation
- Network failure scenarios
- Invalid receipt handling

## Support Resources
- [Apple In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [Receipt Validation Guide](https://developer.apple.com/documentation/appstorereceipts)

## Troubleshooting

### Common Issues
1. **Products not loading**: Verify product IDs match exactly
2. **Sandbox purchases failing**: Check tester account configuration
3. **Receipt validation errors**: Verify shared secret and URL
4. **Missing entitlements**: Ensure com.apple.developer.in-app-payments is enabled

### Debug Commands
```bash
# Check IAP service status
console.log('IAP connected:', IAPService.isConnected);
console.log('Products loaded:', IAPService.products.length);

# Verify product IDs
IAPService.products.forEach(product => {
  console.log('Product:', product.productId, 'Price:', product.price);
});
```

This comprehensive setup ensures your iOS In-App Purchase integration is production-ready for the App Store.
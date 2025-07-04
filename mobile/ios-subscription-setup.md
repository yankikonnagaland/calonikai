# iOS Subscription Setup for Calonik

## Apple In-App Purchase Configuration

### 1. App Store Connect Setup

#### Create Subscription Group
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create Subscription Group: "Calonik Subscription Plans"
3. Reference Name: "calonik_subscriptions"

#### Create Subscription Products
**Basic Plan:**
- Product ID: `ai.calonik.app.basic_monthly`
- Reference Name: `Calonik Basic Monthly`
- Duration: 1 Month
- Price Tier: ₹99 (Tier 5)
- Localized Description: "Essential nutrition tracking with limited AI food scans"

**Premium Plan:**
- Product ID: `ai.calonik.app.premium_monthly`
- Reference Name: `Calonik Premium Monthly`  
- Duration: 1 Month
- Price Tier: ₹399 (Tier 15)
- Localized Description: "Unlimited AI scans, enhanced analytics, and premium features"

### 2. Code Integration

#### Install Dependencies
```bash
npm install react-native-iap
# For Expo managed workflow:
expo install react-native-iap
```

#### Subscription Service Implementation
```typescript
// services/iosSubscriptions.ts
import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  requestSubscription,
  finishTransaction,
  clearTransactionIOS,
  getSubscriptions,
  validateReceiptIos
} from 'react-native-iap';

const subscriptionSkus = [
  'ai.calonik.app.basic_monthly',
  'ai.calonik.app.premium_monthly'
];

export class IOSSubscriptionService {
  constructor() {
    this.initIAP();
  }

  async initIAP() {
    try {
      await initConnection();
      await this.getSubscriptionProducts();
      this.setupListeners();
    } catch (error) {
      console.error('IAP initialization failed:', error);
    }
  }

  async getSubscriptionProducts() {
    try {
      const subscriptions = await getSubscriptions(subscriptionSkus);
      return subscriptions;
    } catch (error) {
      console.error('Failed to get subscription products:', error);
      return [];
    }
  }

  setupListeners() {
    const purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase) => {
        const receipt = purchase.transactionReceipt;
        
        if (receipt) {
          try {
            // Verify receipt with Apple
            const isValid = await validateReceiptIos(receipt, false);
            
            if (isValid) {
              // Send receipt to your backend for verification
              await this.verifyPurchaseWithBackend(purchase);
              
              // Finish the transaction
              await finishTransaction(purchase);
              
              // Update user subscription status
              await this.updateUserSubscription(purchase.productId);
            }
          } catch (error) {
            console.error('Purchase verification failed:', error);
          }
        }
      }
    );

    const purchaseErrorSubscription = purchaseErrorListener(
      (error) => {
        console.error('Purchase error:', error);
      }
    );

    return () => {
      purchaseUpdateSubscription?.remove();
      purchaseErrorSubscription?.remove();
    };
  }

  async purchaseSubscription(productId: string) {
    try {
      await requestSubscription(productId);
    } catch (error) {
      throw new Error(`Purchase failed: ${error.message}`);
    }
  }

  async verifyPurchaseWithBackend(purchase: any) {
    const response = await fetch('https://your-api.com/verify-ios-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        userId: 'current-user-id'
      })
    });

    if (!response.ok) {
      throw new Error('Backend verification failed');
    }

    return response.json();
  }

  async updateUserSubscription(productId: string) {
    const planType = productId.includes('basic') ? 'basic' : 'premium';
    
    // Update local storage or state management
    // Sync with your backend user system
  }
}
```

### 3. Backend Receipt Verification

#### Server-side Verification Endpoint
```typescript
// server/routes/ios-subscriptions.ts
import { Router } from 'express';

const router = Router();

router.post('/verify-ios-purchase', async (req, res) => {
  const { receipt, productId, userId } = req.body;

  try {
    // Verify receipt with Apple's servers
    const verificationResult = await verifyReceiptWithApple(receipt);
    
    if (verificationResult.status === 0) {
      // Receipt is valid, activate subscription
      await activateUserSubscription(userId, productId);
      
      res.json({ 
        success: true, 
        subscription: verificationResult.latest_receipt_info[0]
      });
    } else {
      res.status(400).json({ error: 'Invalid receipt' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

async function verifyReceiptWithApple(receipt: string) {
  const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': process.env.APPLE_SHARED_SECRET, // From App Store Connect
      'exclude-old-transactions': true
    })
  });

  return response.json();
}
```

### 4. UI Integration

#### Replace Razorpay Modal with iOS IAP
```typescript
// components/SubscriptionModal.tsx
import { IOSSubscriptionService } from '../services/iosSubscriptions';

const subscriptionService = new IOSSubscriptionService();

export function SubscriptionModal() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planType: 'basic' | 'premium') => {
    setLoading(true);
    
    try {
      const productId = planType === 'basic' 
        ? 'ai.calonik.app.basic_monthly'
        : 'ai.calonik.app.premium_monthly';
        
      await subscriptionService.purchaseSubscription(productId);
      
      // Success handled in purchase listener
    } catch (error) {
      Alert.alert('Purchase Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={() => handleSubscribe('basic')}
        disabled={loading}
      >
        <Text>Subscribe to Basic (₹99/month)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handleSubscribe('premium')}
        disabled={loading}
      >
        <Text>Subscribe to Premium (₹399/month)</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 5. Testing Subscriptions

#### Sandbox Testing
1. Create sandbox test users in App Store Connect
2. Sign out of App Store on test device
3. Test purchase flow with sandbox account
4. Verify receipt validation works

#### TestFlight Testing
- Internal testing with real Apple IDs
- External testing with recruited testers
- Test subscription management and cancellation

### 6. Production Requirements

#### App Store Connect Configuration
- [ ] Subscription group created
- [ ] Products configured with correct pricing
- [ ] Localized descriptions added
- [ ] Terms and conditions updated
- [ ] Subscription management UI implemented

#### Backend Updates
- [ ] Apple receipt verification endpoint
- [ ] Subscription status synchronization
- [ ] Webhook handling for subscription changes
- [ ] User access control based on subscription status

#### Compliance
- [ ] Auto-renewable subscription terms disclosed
- [ ] Restore purchases functionality implemented
- [ ] Subscription management accessible to users
- [ ] Clear pricing and billing information

---

**Important:** Apple requires all iOS apps with subscriptions to use their In-App Purchase system. Your current Razorpay integration will be rejected during App Store review.
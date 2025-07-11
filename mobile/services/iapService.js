// iOS In-App Purchase Service for Calonik.ai
// This service handles subscription purchases through Apple's StoreKit

import { Platform, Alert } from 'react-native';

// Conditionally import InAppPurchases only on iOS
let InAppPurchases = null;
if (Platform.OS === 'ios') {
  try {
    InAppPurchases = require('expo-in-app-purchases');
  } catch (error) {
    console.log('InAppPurchases not available on this platform');
  }
}

// Product IDs configured in App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  BASIC: 'ai.calonik.basic.monthly',
  PREMIUM: 'ai.calonik.premium.monthly'
};

class IAPService {
  constructor() {
    this.isConnected = false;
    this.products = [];
    this.currentUser = null;
  }

  // Initialize the IAP service
  async initialize(userId) {
    // Only initialize on iOS
    if (Platform.OS !== 'ios' || !InAppPurchases) {
      console.log('IAP Service not available on this platform');
      return false;
    }
    
    try {
      this.currentUser = userId;
      
      // Connect to the store
      await InAppPurchases.connectAsync();
      this.isConnected = true;
      
      // Get product information from App Store
      const { responseCode, results } = await InAppPurchases.getProductsAsync([
        SUBSCRIPTION_PRODUCTS.BASIC,
        SUBSCRIPTION_PRODUCTS.PREMIUM
      ]);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.products = results;
        console.log('IAP Products loaded:', this.products);
        return true;
      } else {
        throw new Error('Failed to load products');
      }
    } catch (error) {
      console.error('IAP initialization failed:', error);
      return false;
    }
  }

  // Get available subscription products
  getProducts() {
    return this.products;
  }

  // Get specific product by ID
  getProduct(productId) {
    return this.products.find(product => product.productId === productId);
  }

  // Purchase a subscription
  async purchaseSubscription(productId) {
    // Only allow purchases on iOS
    if (Platform.OS !== 'ios' || !InAppPurchases) {
      Alert.alert('Not Available', 'In-app purchases are only available on iOS devices');
      return { success: false, error: 'Platform not supported' };
    }
    
    try {
      if (!this.isConnected) {
        throw new Error('IAP service not connected');
      }

      const product = this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Start the purchase flow
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        const purchase = results[0];
        
        // Verify the purchase with your backend
        const isValid = await this.verifyPurchase(purchase);
        
        if (isValid) {
          // Activate subscription in your backend
          await this.activateSubscription(purchase);
          return {
            success: true,
            transactionId: purchase.transactionId,
            productId: purchase.productId
          };
        } else {
          throw new Error('Purchase verification failed');
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.UserCancel) {
        return { success: false, cancelled: true };
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', error.message);
      return { success: false, error: error.message };
    }
  }

  // Verify purchase with Apple's servers via your backend
  async verifyPurchase(purchase) {
    try {
      const response = await fetch('https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/ios-verify-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData: purchase.transactionReceipt,
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          userId: this.currentUser
        })
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Purchase verification error:', error);
      return false;
    }
  }

  // Activate subscription in backend
  async activateSubscription(purchase) {
    try {
      const planType = purchase.productId === SUBSCRIPTION_PRODUCTS.PREMIUM ? 'premium' : 'basic';
      
      const response = await fetch('https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/activate-ios-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentUser,
          subscriptionPlan: planType,
          transactionId: purchase.transactionId,
          productId: purchase.productId,
          receiptData: purchase.transactionReceipt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to activate subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription activation error:', error);
      throw error;
    }
  }

  // Restore previous purchases
  async restorePurchases() {
    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        // Process restored purchases
        for (const purchase of results) {
          if (purchase.acknowledged === false) {
            await this.verifyPurchase(purchase);
            await this.activateSubscription(purchase);
          }
        }
        
        return { success: true, restoredCount: results.length };
      } else {
        throw new Error('Failed to restore purchases');
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get subscription status from backend
  async getSubscriptionStatus() {
    try {
      const response = await fetch(`https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/user-subscription/${this.currentUser}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { subscriptionStatus: 'free' };
    }
  }

  // Cleanup
  async disconnect() {
    if (this.isConnected) {
      await InAppPurchases.disconnectAsync();
      this.isConnected = false;
    }
  }
}

export default new IAPService();
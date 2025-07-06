// iOS In-App Purchase Subscription Modal for Calonik.ai
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import IAPService, { SUBSCRIPTION_PRODUCTS } from '../services/iapService';

const SubscriptionModal = ({ visible, onClose, userId }) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [products, setProducts] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');

  useEffect(() => {
    if (visible && userId) {
      initializeIAP();
    }
  }, [visible, userId]);

  const initializeIAP = async () => {
    setLoading(true);
    try {
      const initialized = await IAPService.initialize(userId);
      if (initialized) {
        const availableProducts = IAPService.getProducts();
        setProducts(availableProducts);
        
        const status = await IAPService.getSubscriptionStatus();
        setSubscriptionStatus(status.subscriptionStatus || 'free');
      }
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    }
    setLoading(false);
  };

  const handlePurchase = async (productId) => {
    setPurchasing(true);
    try {
      const result = await IAPService.purchaseSubscription(productId);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          'Your subscription has been activated. You now have access to all premium features.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else if (!result.cancelled) {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Purchase Failed', error.message);
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const result = await IAPService.restorePurchases();
      if (result.success) {
        Alert.alert(
          'Restored!', 
          `Successfully restored ${result.restoredCount} purchases`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Restore Failed', result.error || 'No purchases to restore');
      }
    } catch (error) {
      Alert.alert('Restore Failed', error.message);
    }
    setPurchasing(false);
  };

  const formatPrice = (product) => {
    return product.price ? `$${product.price}` : 'Loading...';
  };

  const getProductFeatures = (productId) => {
    if (productId === SUBSCRIPTION_PRODUCTS.PREMIUM) {
      return [
        '5+ AI photo scans daily',
        '200+ food searches daily',
        'Enhanced exercise tracking',
        'Complete health analytics',
        'Goal progress tracking',
        'Priority support'
      ];
    } else {
      return [
        'Limited AI photo scans',
        '100 food searches daily',
        'Basic nutrition tracking',
        'Standard exercise logging'
      ];
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Plan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {subscriptionStatus !== 'free' && (
              <View style={styles.currentStatusCard}>
                <Text style={styles.statusText}>
                  Current Plan: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                </Text>
              </View>
            )}

            {products.map((product) => {
              const isPremium = product.productId === SUBSCRIPTION_PRODUCTS.PREMIUM;
              const features = getProductFeatures(product.productId);
              
              return (
                <View key={product.productId} style={[
                  styles.planCard,
                  isPremium && styles.premiumCard
                ]}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>
                      {isPremium ? 'Premium' : 'Basic'}
                    </Text>
                    {isPremium && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most Popular</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.planPrice}>
                    {formatPrice(product)}/month
                  </Text>
                  
                  <View style={styles.featuresContainer}>
                    {features.map((feature, index) => (
                      <Text key={index} style={styles.featureText}>
                        • {feature}
                      </Text>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      isPremium && styles.premiumButton,
                      purchasing && styles.disabledButton
                    ]}
                    onPress={() => handlePurchase(product.productId)}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.subscribeButtonText}>
                        Subscribe to {isPremium ? 'Premium' : 'Basic'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={purchasing}
            >
              <Text style={styles.restoreButtonText}>
                Restore Previous Purchases
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Subscriptions will be charged through your iTunes account. 
              Cancel anytime in App Store settings. Terms apply.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 18,
  },
  currentStatusCard: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  premiumCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  popularBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  premiumButton: {
    backgroundColor: '#3B82F6',
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  restoreButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  disclaimer: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SubscriptionModal;
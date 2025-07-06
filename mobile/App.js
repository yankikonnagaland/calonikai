import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import SubscriptionModal from './components/SubscriptionModal';
// WebView removed due to dependency conflicts

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);
  const [userId] = useState('mobile_user_123'); // In a real app, this would come from authentication

  // Simulate app initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const openWebApp = () => {
    // Open directly in browser since WebView has dependency conflicts
    openInBrowser();
  };

  const openInBrowser = () => {
    const url = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev';
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open web browser');
      console.error('Error opening URL:', err);
    });
  };

  // Removed WebView functionality due to dependency conflicts

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splashContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Calonik.ai</Text>
            <Text style={styles.subtitle}>Smart Calorie Tracker</Text>
            <Text style={styles.description}>
              Track your nutrition and reach your health goals with AI-powered food recognition
            </Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Initializing...</Text>
          </View>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // WebView functionality removed due to dependency conflicts
  // Direct browser opening is the primary method

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Calonik.ai</Text>
          <Text style={styles.subtitle}>Mobile Access</Text>
          <Text style={styles.description}>
            Access your full Calonik.ai experience with all features including AI food analysis, 
            nutrition tracking, exercise logging, and detailed health dashboards.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={openWebApp}>
            <Text style={styles.primaryButtonText}>Launch Calonik.ai</Text>
            <Text style={styles.buttonSubtext}>Open your full nutrition tracker</Text>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              This mobile app launcher opens your complete Calonik.ai web application with all features:
            </Text>
            <Text style={styles.infoSubtext}>
              • AI food camera and search{'\n'}
              • Nutrition tracking and analytics{'\n'}
              • Exercise logging{'\n'}
              • Health dashboards and goals
            </Text>
          </View>
        </View>

        <View style={styles.featuresPreview}>
          <Text style={styles.featuresTitle}>Full Features Available:</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>🔍 AI-powered food search & analysis</Text>
            <Text style={styles.featureItem}>📷 Smart food camera recognition</Text>
            <Text style={styles.featureItem}>📊 Detailed nutrition tracking</Text>
            <Text style={styles.featureItem}>💪 Exercise & workout logging</Text>
            <Text style={styles.featureItem}>📈 Health progress dashboards</Text>
            <Text style={styles.featureItem}>🎯 Personalized nutrition goals</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.subscriptionButton}
            onPress={() => setShowSubscription(true)}
          >
            <Text style={styles.subscriptionButtonText}>
              View Subscription Plans
            </Text>
          </TouchableOpacity>
        </View>
        
        <SubscriptionModal
          visible={showSubscription}
          onClose={() => setShowSubscription(false)}
          userId={userId}
        />
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 10,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonSubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },
  featuresPreview: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  subscriptionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  subscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Removed WebView-related styles due to dependency conflicts
});
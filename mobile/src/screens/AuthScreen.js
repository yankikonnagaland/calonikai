import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Image,
  ScrollView 
} from 'react-native';
import { AuthService } from '../services/AuthService';

export default function AuthScreen({ onLoginSuccess, sessionId }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const user = await AuthService.loginWithGoogle();
      onLoginSuccess(user);
    } catch (error) {
      Alert.alert('Login Failed', 'Unable to sign in. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // For now, treat guest as logged in with limited features
    const guestUser = {
      id: sessionId,
      email: 'guest@mobile.app',
      name: 'Guest User',
      subscriptionStatus: 'free',
    };
    onLoginSuccess(guestUser);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Calonik.ai</Text>
        <Text style={styles.subtitle}>Your AI-Powered Nutrition Companion</Text>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>What you get:</Text>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🍎</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Smart Food Tracking</Text>
            <Text style={styles.featureDescription}>AI-powered food recognition and nutrition analysis</Text>
          </View>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📸</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Camera Integration</Text>
            <Text style={styles.featureDescription}>Snap photos to instantly identify foods and calories</Text>
          </View>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>💪</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Exercise Tracking</Text>
            <Text style={styles.featureDescription}>Timer-based workouts with calorie burn calculations</Text>
          </View>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Progress Analytics</Text>
            <Text style={styles.featureDescription}>Weekly trends and personalized health insights</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={handleGuestAccess}
          disabled={isLoading}
        >
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flexGrow: 1,
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
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  guestButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
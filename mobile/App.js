import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SubscriptionModal from './components/SubscriptionModal';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [navigationReady, setNavigationReady] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [userId] = useState('mobile_user_123');

  // Simulate app initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splashContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Calonik.ai</Text>
            <Text style={styles.subtitle}>AI Nutrition Tracker</Text>
            <Text style={styles.description}>
              Full native mobile app with AI-powered food recognition, nutrition tracking, 
              exercise logging, and personalized health insights
            </Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Initializing native app...</Text>
          </View>
          
          <View style={styles.featuresPreview}>
            <Text style={styles.featuresTitle}>Native Mobile Features:</Text>
            <Text style={styles.featureItem}>📱 Full offline functionality</Text>
            <Text style={styles.featureItem}>📷 Native camera integration</Text>
            <Text style={styles.featureItem}>🤖 AI food recognition</Text>
            <Text style={styles.featureItem}>📊 Real-time nutrition tracking</Text>
            <Text style={styles.featureItem}>💪 Exercise timer & logging</Text>
            <Text style={styles.featureItem}>👤 Profile & goal management</Text>
          </View>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Main app with navigation
  return (
    <NavigationContainer 
      onReady={() => setNavigationReady(true)}
      fallback={
        <SafeAreaView style={styles.container}>
          <View style={styles.splashContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading navigation...</Text>
          </View>
        </SafeAreaView>
      }
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E293B',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'Calonik.ai',
            headerRight: () => (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowSubscription(true)}
              >
                <Text style={styles.headerButtonText}>👑 Pro</Text>
              </TouchableOpacity>
            )
          }} 
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen} 
          options={{ title: 'AI Food Camera' }} 
        />
        <Stack.Screen 
          name="Exercise" 
          component={ExerciseScreen} 
          options={{ title: 'Exercise Tracker' }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Profile & Goals' }} 
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: 'Health Dashboard' }} 
        />
      </Stack.Navigator>
      
      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
        userId={userId}
      />
      
      <StatusBar style="light" />
    </NavigationContainer>
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
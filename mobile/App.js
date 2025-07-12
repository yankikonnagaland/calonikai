import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import TrackerScreen from './src/screens/TrackerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AuthScreen from './src/screens/AuthScreen';
import LoadingScreen from './src/screens/LoadingScreen';

// Import services
import { AuthService } from './src/services/AuthService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator({ user, sessionId, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tracker') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Exercise') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#1f2937',
          borderTopColor: '#374151',
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Tracker" 
        options={{ 
          title: 'Food Tracker',
          headerTitle: `Calonik.ai${user?.subscriptionStatus === 'premium' ? ' 👑' : user?.subscriptionStatus === 'basic' ? ' 🔰' : ''}`
        }}
      >
        {(props) => <TrackerScreen {...props} user={user} sessionId={sessionId} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile" 
        options={{ title: 'Profile' }}
      >
        {(props) => <ProfileScreen {...props} user={user} sessionId={sessionId} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Exercise" 
        options={{ title: 'Exercise' }}
      >
        {(props) => <ExerciseScreen {...props} user={user} sessionId={sessionId} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Dashboard" 
        options={{ title: 'Dashboard' }}
      >
        {(props) => <DashboardScreen {...props} user={user} sessionId={sessionId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize session
      let storedSessionId = await AsyncStorage.getItem('sessionId');
      if (!storedSessionId) {
        storedSessionId = 'mobile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('sessionId', storedSessionId);
      }
      setSessionId(storedSessionId);
      
      // Check authentication status
      const authData = await AuthService.checkAuthStatus();
      if (authData && authData.user) {
        setUser(authData.user);
        setIsAuthenticated(true);
        // Update session to use authenticated user ID
        setSessionId(authData.user.id);
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setSessionId(userData.id);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      // Reset to guest session
      const guestSessionId = 'mobile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem('sessionId', guestSessionId);
      setSessionId(guestSessionId);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth">
              {(props) => (
                <AuthScreen 
                  {...props} 
                  onLoginSuccess={handleLoginSuccess}
                  sessionId={sessionId}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main">
              {(props) => (
                <TabNavigator 
                  {...props} 
                  user={user} 
                  sessionId={sessionId}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
});
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider } from './src/context/AppContext';
import TrackerScreen from './src/screens/TrackerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
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
              tabBarActiveTintColor: '#f97316',
              tabBarInactiveTintColor: '#64748b',
              tabBarStyle: {
                backgroundColor: '#0f172a',
                borderTopColor: '#1e293b',
                paddingBottom: 8,
                paddingTop: 8,
                height: 70,
              },
              headerStyle: {
                backgroundColor: '#0f172a',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen 
              name="Tracker" 
              component={TrackerScreen}
              options={{ title: 'Food Tracker' }}
            />
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Tab.Screen 
              name="Exercise" 
              component={ExerciseScreen}
              options={{ title: 'Exercise' }}
            />
            <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Dashboard' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" backgroundColor="#0f172a" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
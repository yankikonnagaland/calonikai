import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import TrackerScreen from './src/screens/TrackerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import DashboardScreen from './src/screens/DashboardScreen';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const Tab = createBottomTabNavigator();

// Dark theme for Calonik
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    onSurface: '#94A3B8',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#0F172A" />
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: string;

                  if (route.name === 'Tracker') {
                    iconName = 'restaurant';
                  } else if (route.name === 'Profile') {
                    iconName = 'person';
                  } else if (route.name === 'Exercise') {
                    iconName = 'fitness-center';
                  } else if (route.name === 'Dashboard') {
                    iconName = 'dashboard';
                  } else {
                    iconName = 'help';
                  }

                  return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6366F1',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                  backgroundColor: '#1E293B',
                  borderTopColor: '#334155',
                },
                headerStyle: {
                  backgroundColor: '#0F172A',
                },
                headerTintColor: '#F1F5F9',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerTitle: () => (
                  <View style={{ alignItems: 'center' }}>
                    <Image 
                      source={require('./assets/calonik-logo.png')}
                      style={{ width: 100, height: 40 }}
                      resizeMode="contain"
                    />
                  </View>
                ),
              })}
            >
              <Tab.Screen name="Tracker" component={TrackerScreen} />
              <Tab.Screen name="Profile" component={ProfileScreen} />
              <Tab.Screen name="Exercise" component={ExerciseScreen} />
              <Tab.Screen name="Dashboard" component={DashboardScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
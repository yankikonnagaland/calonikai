import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('splash');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Simulate app initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setCurrentView('home');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const searchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Try to connect to the web app's API
      const response = await fetch(`https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/food/search?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.slice(0, 5)); // Show top 5 results
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      // Fallback to mock data for demo
      setSearchResults([
        { id: 1, name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
        { id: 2, name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
        { id: 3, name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      ]);
    }
    setIsSearching(false);
  };

  if (isLoading || currentView === 'splash') {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>Calonik.ai</Text>
        <Text style={styles.appSubtitle}>Mobile Food Tracker</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Food</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter food name (e.g., apple, rice, chicken)"
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchFood}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={searchFood}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map((food) => (
              <TouchableOpacity key={food.id} style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodDetails}>
                    {food.calories} cal | {food.protein}g protein | {food.carbs}g carbs | {food.fat}g fat
                  </Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureTitle}>AI Camera</Text>
              <Text style={styles.featureDesc}>Scan food with camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Dashboard</Text>
              <Text style={styles.featureDesc}>View nutrition trends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>🏃</Text>
              <Text style={styles.featureTitle}>Exercise</Text>
              <Text style={styles.featureDesc}>Track workouts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>👤</Text>
              <Text style={styles.featureTitle}>Profile</Text>
              <Text style={styles.featureDesc}>Set health goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.webAccessSection}>
          <Text style={styles.sectionTitle}>Full Web Experience</Text>
          <Text style={styles.webAccessText}>
            For complete features including AI food analysis, detailed charts, and profile management, visit the full web application.
          </Text>
          <TouchableOpacity 
            style={styles.webButton}
            onPress={() => Alert.alert('Web Access', 'Open Calonik.ai in your mobile browser for full functionality')}
          >
            <Text style={styles.webButtonText}>Open Web App</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
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
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
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
  appHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 30,
  },
  foodItem: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  foodDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  featuresSection: {
    marginBottom: 30,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  featureCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 15,
    width: '47%',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  webAccessSection: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  webAccessText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 15,
  },
  webButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  webButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
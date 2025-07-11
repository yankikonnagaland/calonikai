import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const API_BASE = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api';

  useEffect(() => {
    loadTodaysMeals();
  }, []);

  const loadTodaysMeals = async () => {
    try {
      const sessionId = await getSessionId();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_BASE}/meal/${sessionId}/${today}`);
      const mealsData = await response.json();
      
      setMeals(mealsData);
      calculateDailyStats(mealsData);
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const getSessionId = async () => {
    let sessionId = await AsyncStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const calculateDailyStats = (mealsData) => {
    const stats = mealsData.reduce((acc, meal) => {
      acc.calories += meal.frontendCalories || meal.calories || 0;
      acc.protein += meal.frontendProtein || meal.protein || 0;
      acc.carbs += meal.frontendCarbs || meal.carbs || 0;
      acc.fat += meal.frontendFat || meal.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    setDailyStats(stats);
  };

  const searchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const sessionId = await getSessionId();
      const response = await fetch(`${API_BASE}/enhanced-food-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
          userId: sessionId
        })
      });
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search foods');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFoodToMeal = async (food, quantity = 1, unit = 'serving') => {
    try {
      const sessionId = await getSessionId();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_BASE}/meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          sessionId,
          foodId: food.id,
          quantity,
          unit,
          date: today
        })
      });
      
      if (response.ok) {
        Alert.alert('Success', `${food.name} added to your meal!`);
        loadTodaysMeals();
        setSearchQuery('');
        setSearchResults([]);
      } else {
        Alert.alert('Error', 'Failed to add food to meal');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add food to meal');
      console.error('Add food error:', error);
    }
  };

  const removeFoodFromMeal = async (mealItemId) => {
    try {
      const response = await fetch(`${API_BASE}/meal/${mealItemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Food removed from meal');
        loadTodaysMeals();
      } else {
        Alert.alert('Error', 'Failed to remove food');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove food');
      console.error('Remove food error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calonik.ai</Text>
          <Text style={styles.subtitle}>Your AI Nutrition Tracker</Text>
        </View>

        {/* Daily Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Nutrition</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(dailyStats.calories)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(dailyStats.protein)}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(dailyStats.carbs)}g</Text>
              <Text style={styles.statLabel}>Carbs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(dailyStats.fat)}g</Text>
              <Text style={styles.statLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Food Search */}
        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Add Food</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchFood}
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={searchFood}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.foodItem}
                  onPress={() => addFoodToMeal(food)}
                >
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodDetails}>
                      {Math.round(food.calories)} cal • {Math.round(food.protein)}g protein
                    </Text>
                    {food.source && (
                      <Text style={styles.foodSource}>
                        {food.source === 'ai' ? '🤖 AI Generated' : 
                         food.accuracy === 'high' ? '✅ Verified' : '📊 Database'}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Current Meals */}
        <View style={styles.mealsCard}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {meals.length === 0 ? (
            <Text style={styles.emptyText}>No meals logged today</Text>
          ) : (
            meals.map((meal, index) => (
              <View key={index} style={styles.mealItem}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.food?.name || 'Unknown Food'}</Text>
                  <Text style={styles.mealDetails}>
                    {meal.quantity} {meal.unit} • {Math.round(meal.frontendCalories || meal.calories || 0)} cal
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeFoodFromMeal(meal.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.actionButtonText}>📷 AI Food Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Exercise')}
          >
            <Text style={styles.actionButtonText}>💪 Log Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionButtonText}>👤 Profile & Goals</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  searchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  searchResults: {
    marginTop: 16,
  },
  foodItem: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  foodSource: {
    fontSize: 12,
    color: '#64748B',
  },
  addButton: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mealItem: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 14,
    color: '#94A3B8',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
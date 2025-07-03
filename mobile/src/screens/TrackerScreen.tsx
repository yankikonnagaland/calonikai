import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService, Food, MealItem } from '../services/api';
import { SessionManager } from '../utils/session';
import FoodCameraComponent from '../components/FoodCamera';
import LogoHeader from '../components/LogoHeader';

const TrackerScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [showCamera, setShowCamera] = useState(false);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();
  const sessionId = SessionManager.getSessionId();

  // Search foods query
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['foods', searchQuery],
    queryFn: () => apiService.searchFoods(searchQuery),
    enabled: searchQuery.length > 2,
    staleTime: 5 * 60 * 1000,
  });

  // Get current meal items
  const { data: mealItems = [], isLoading: isLoadingMeals } = useQuery({
    queryKey: ['meal-items', sessionId, selectedDate],
    queryFn: () => apiService.getMealItems(sessionId, selectedDate),
    staleTime: 1 * 60 * 1000,
  });

  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: apiService.addMealItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-items'] });
      setSelectedFood(null);
      setQuantity('1');
      setUnit('serving');
      Alert.alert('Success', 'Food added to meal!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add food to meal');
    },
  });

  // Remove meal mutation
  const removeMealMutation = useMutation({
    mutationFn: apiService.removeMealItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-items'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to remove food item');
    },
  });

  // Clear meal mutation
  const clearMealMutation = useMutation({
    mutationFn: () => apiService.clearMeal(sessionId, selectedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-items'] });
      Alert.alert('Success', 'Meal cleared!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to clear meal');
    },
  });

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    setUnit(food.defaultUnit);
    setSearchQuery('');
  };

  const addToMeal = () => {
    if (!selectedFood) return;

    addMealMutation.mutate({
      sessionId,
      foodId: selectedFood.id,
      quantity: parseInt(quantity),
      unit,
      date: selectedDate,
    });
  };

  const calculateTotalCalories = () => {
    return mealItems.reduce((total, item) => {
      const multiplier = getMultiplier(item.unit, item.food);
      return total + (item.food.calories * multiplier * item.quantity);
    }, 0);
  };

  const getMultiplier = (unit: string, food: Food) => {
    // Simplified multiplier logic from your web app
    const unitLower = unit.toLowerCase();
    if (unitLower.includes('small')) return 0.7;
    if (unitLower.includes('medium')) return 1.0;
    if (unitLower.includes('large')) return 1.5;
    if (unitLower.includes('piece')) return 0.8;
    if (unitLower.includes('slice')) return 0.6;
    return 1.0;
  };

  if (showCamera) {
    return (
      <FoodCameraComponent
        onFoodDetected={(foods) => {
          // Handle detected foods
          setShowCamera(false);
        }}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LogoHeader />
      <View style={styles.header}>
        <Text style={styles.title}>Food Tracker</Text>
        <Text style={styles.subtitle}>Track your daily nutrition</Text>
      </View>

      {/* AI Camera Button */}
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => setShowCamera(true)}
      >
        <Icon name="camera-alt" size={24} color="#fff" />
        <Text style={styles.cameraButtonText}>AI Food Scanner</Text>
      </TouchableOpacity>

      {/* Food Search */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Search Foods</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for foods..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {isSearching && <ActivityIndicator style={styles.loader} />}

          {searchResults.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodItem}
              onPress={() => selectFood(food)}
            >
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodInfo}>
                {food.calories} cal | {food.protein}g protein
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Selected Food */}
      {selectedFood && (
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Add to Meal</Text>
            <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.numberInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Unit</Text>
                <TextInput
                  style={styles.textInput}
                  value={unit}
                  onChangeText={setUnit}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Button
              mode="contained"
              onPress={addToMeal}
              loading={addMealMutation.isPending}
              style={styles.addButton}
            >
              Add to Meal
            </Button>
          </View>
        </Card>
      )}

      {/* Current Meal */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Meal</Text>
            <Button
              mode="outlined"
              onPress={() => clearMealMutation.mutate()}
              disabled={mealItems.length === 0}
              compact
            >
              Clear
            </Button>
          </View>

          {isLoadingMeals ? (
            <ActivityIndicator style={styles.loader} />
          ) : mealItems.length === 0 ? (
            <Text style={styles.emptyText}>No items in your meal yet</Text>
          ) : (
            <>
              {mealItems.map((item) => (
                <View key={item.id} style={styles.mealItem}>
                  <View style={styles.mealItemInfo}>
                    <Text style={styles.mealItemName}>{item.food.name}</Text>
                    <Text style={styles.mealItemDetails}>
                      {item.quantity} {item.unit} | {Math.round(item.food.calories * getMultiplier(item.unit, item.food) * item.quantity)} cal
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeMealMutation.mutate(item.id)}
                    style={styles.removeButton}
                  >
                    <Icon name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={styles.totalCalories}>
                <Text style={styles.totalCaloriesText}>
                  Total: {Math.round(calculateTotalCalories())} calories
                </Text>
              </View>
            </>
          )}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  cameraButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#1E293B',
    marginBottom: 16,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  foodItem: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  foodInfo: {
    fontSize: 14,
    color: '#94A3B8',
  },
  selectedFoodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textInput: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#6366F1',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    paddingVertical: 20,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  mealItemDetails: {
    fontSize: 14,
    color: '#94A3B8',
  },
  removeButton: {
    padding: 8,
  },
  totalCalories: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  totalCaloriesText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default TrackerScreen;
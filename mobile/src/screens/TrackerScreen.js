import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';
import FoodCameraModal from '../components/FoodCameraModal';
import CalendarPicker from '../components/CalendarPicker';

export default function TrackerScreen({ user, sessionId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mealItems, setMealItems] = useState([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodQuantity, setFoodQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('');

  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    loadMealItems();
  }, [selectedDate, sessionId]);

  const loadMealItems = async () => {
    try {
      setIsLoadingMeals(true);
      const items = await ApiService.getMeals(sessionId, dateString);
      setMealItems(items || []);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoadingMeals(false);
    }
  };

  const searchFoods = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await ApiService.searchFoods(searchQuery);
      setSearchResults(results || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to search foods. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectFood = (food) => {
    setSelectedFood(food);
    setSelectedUnit(food.unitOptions?.[0] || 'serving');
    setSearchResults([]);
    setSearchQuery('');
  };

  const addFoodToMeal = async () => {
    if (!selectedFood) return;

    try {
      const mealData = {
        sessionId,
        date: dateString,
        foodId: selectedFood.id,
        quantity: parseFloat(foodQuantity) || 1,
        unit: selectedUnit,
      };

      await ApiService.addMealItem(mealData);
      await loadMealItems();
      
      // Reset form
      setSelectedFood(null);
      setFoodQuantity('1');
      setSelectedUnit('');
      
      Alert.alert('Success', 'Food added to your meal!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
      console.error('Add food error:', error);
    }
  };

  const removeFoodFromMeal = async (itemId) => {
    try {
      await ApiService.removeMealItem(itemId);
      await loadMealItems();
      Alert.alert('Success', 'Food removed from meal');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove food');
      console.error('Remove food error:', error);
    }
  };

  const submitMeal = async () => {
    if (mealItems.length === 0) {
      Alert.alert('Error', 'Add some foods to your meal first');
      return;
    }

    try {
      // Calculate totals
      const totalCalories = mealItems.reduce((sum, item) => 
        sum + ((item.food?.calories || 0) * (item.quantity || 1)), 0
      );
      const totalProtein = mealItems.reduce((sum, item) => 
        sum + ((item.food?.protein || 0) * (item.quantity || 1)), 0
      );
      const totalCarbs = mealItems.reduce((sum, item) => 
        sum + ((item.food?.carbs || 0) * (item.quantity || 1)), 0
      );
      const totalFat = mealItems.reduce((sum, item) => 
        sum + ((item.food?.fat || 0) * (item.quantity || 1)), 0
      );

      const summaryData = {
        sessionId,
        date: dateString,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        caloriesBurned: 0,
        netCalories: totalCalories,
      };

      await ApiService.submitDailySummary(summaryData);
      Alert.alert('Success', 'Meal submitted to your daily log!');
      
      // Clear current meal items (they're now in daily summary)
      setMealItems([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit meal');
      console.error('Submit meal error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealItems();
    setRefreshing(false);
  };

  // Calculate current meal totals
  const mealTotals = mealItems.reduce((totals, item) => {
    const quantity = item.quantity || 1;
    return {
      calories: totals.calories + ((item.food?.calories || 0) * quantity),
      protein: totals.protein + ((item.food?.protein || 0) * quantity),
      carbs: totals.carbs + ((item.food?.carbs || 0) * quantity),
      fat: totals.fat + ((item.food?.fat || 0) * quantity),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Date Picker */}
      <View style={styles.dateContainer}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons name="calendar" size={20} color="#10b981" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Food Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for foods..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchFoods}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={searchFoods}
            disabled={isSearching}
          >
            <Ionicons 
              name={isSearching ? "hourglass" : "search"} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons name="camera" size={20} color="#ffffff" />
          <Text style={styles.cameraButtonText}>AI Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Search Results</Text>
          {searchResults.slice(0, 5).map((food, index) => (
            <TouchableOpacity
              key={index}
              style={styles.foodItem}
              onPress={() => selectFood(food)}
            >
              <View>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodNutrition}>
                  {food.calories} cal • {food.protein}g protein
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#10b981" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Selected Food Form */}
      {selectedFood && (
        <View style={styles.selectedFoodContainer}>
          <Text style={styles.selectedFoodTitle}>Add to Meal</Text>
          <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
          
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <TextInput
              style={styles.quantityInput}
              value={foodQuantity}
              onChangeText={setFoodQuantity}
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>{selectedUnit}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setSelectedFood(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addFoodToMeal}
            >
              <Text style={styles.addButtonText}>Add Food</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Current Meal */}
      <View style={styles.mealContainer}>
        <Text style={styles.mealTitle}>Current Meal</Text>
        
        {isLoadingMeals ? (
          <Text style={styles.loadingText}>Loading meal items...</Text>
        ) : mealItems.length === 0 ? (
          <Text style={styles.emptyText}>No foods added yet</Text>
        ) : (
          <>
            {mealItems.map((item, index) => (
              <View key={index} style={styles.mealItem}>
                <View style={styles.mealItemInfo}>
                  <Text style={styles.mealItemName}>
                    {item.food?.name || 'Unknown Food'}
                  </Text>
                  <Text style={styles.mealItemDetails}>
                    {item.quantity} {item.unit} • {((item.food?.calories || 0) * item.quantity).toFixed(0)} cal
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeFoodFromMeal(item.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Meal Totals */}
            <View style={styles.mealTotals}>
              <Text style={styles.totalsTitle}>Meal Totals</Text>
              <View style={styles.totalsGrid}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{mealTotals.calories.toFixed(0)}</Text>
                  <Text style={styles.totalLabel}>Calories</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{mealTotals.protein.toFixed(1)}</Text>
                  <Text style={styles.totalLabel}>Protein</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{mealTotals.carbs.toFixed(1)}</Text>
                  <Text style={styles.totalLabel}>Carbs</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{mealTotals.fat.toFixed(1)}</Text>
                  <Text style={styles.totalLabel}>Fat</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitMeal}>
              <Text style={styles.submitButtonText}>Submit Meal</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modals */}
      <Modal visible={showCamera} animationType="slide">
        <FoodCameraModal
          onClose={() => setShowCamera(false)}
          onFoodDetected={(food) => {
            setShowCamera(false);
            selectFood(food);
          }}
          sessionId={sessionId}
        />
      </Modal>

      <Modal visible={showCalendar} animationType="slide">
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  dateContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dateText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  cameraButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  cameraButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  foodNutrition: {
    color: '#9ca3af',
    fontSize: 14,
  },
  selectedFoodContainer: {
    padding: 16,
    backgroundColor: '#1f2937',
    margin: 16,
    borderRadius: 8,
  },
  selectedFoodTitle: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedFoodName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: 12,
  },
  quantityInput: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
    width: 80,
    textAlign: 'center',
    marginRight: 12,
  },
  unitText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  mealContainer: {
    padding: 16,
  },
  mealTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  mealItemDetails: {
    color: '#9ca3af',
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  mealTotals: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  totalsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
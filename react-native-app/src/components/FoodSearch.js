import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { searchFoodsDatabase } from '../services/foodDatabase';
import { calculateNutrition } from '../utils/calculations';

export default function FoodSearch() {
  const { selectedDate, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await searchFoodsDatabase(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search foods');
    } finally {
      setIsLoading(false);
    }
  };

  const selectFood = (food) => {
    setSelectedFood(food);
    setUnit(food.defaultUnit || 'serving');
  };

  const addFoodToMeal = () => {
    if (!selectedFood) return;

    const nutrition = calculateNutrition(selectedFood, parseFloat(quantity), unit);
    
    const mealItem = {
      id: Date.now(),
      foodId: selectedFood.id,
      food: selectedFood,
      quantity: parseFloat(quantity),
      unit,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      date: selectedDate,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MEAL', payload: mealItem });
    
    // Reset form
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setQuantity('1');
    setUnit('serving');
    
    Alert.alert('Success', `Added ${selectedFood.name} to your meal!`);
  };

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => selectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDetails}>
          {item.calories} cal • {item.protein}g protein
        </Text>
      </View>
      <View style={styles.foodNutrition}>
        <Text style={styles.calorieText}>{item.calories}</Text>
        <Text style={styles.calorieLabel}>cal</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for food..."
          placeholderTextColor="#64748b"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Ionicons 
            name={isLoading ? 'hourglass' : 'search'} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.resultsList}
            maxHeight={200}
          />
        </View>
      )}

      {/* Selected Food Form */}
      {selectedFood && (
        <View style={styles.selectedFoodContainer}>
          <Text style={styles.selectedFoodTitle}>Add to Meal</Text>
          <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
          
          <View style={styles.quantityContainer}>
            <View style={styles.quantityInput}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.unitInput}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitSelector}>
                {['piece', 'serving', 'cup', 'gram'].map((unitOption) => (
                  <TouchableOpacity
                    key={unitOption}
                    style={[
                      styles.unitOption,
                      unit === unitOption && styles.unitOptionActive
                    ]}
                    onPress={() => setUnit(unitOption)}
                  >
                    <Text style={[
                      styles.unitOptionText,
                      unit === unitOption && styles.unitOptionTextActive
                    ]}>
                      {unitOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addFoodToMeal}>
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add to Meal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 16,
  },
  resultsList: {
    maxHeight: 200,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodDetails: {
    color: '#94a3b8',
    fontSize: 14,
  },
  foodNutrition: {
    alignItems: 'center',
  },
  calorieText: {
    color: '#f97316',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calorieLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  selectedFoodContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
  },
  selectedFoodTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedFoodName: {
    color: '#f97316',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  quantityInput: {
    flex: 1,
    marginRight: 12,
  },
  unitInput: {
    flex: 2,
  },
  inputLabel: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitOptionActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  unitOptionText: {
    color: '#f1f5f9',
    fontSize: 12,
  },
  unitOptionTextActive: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    padding: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
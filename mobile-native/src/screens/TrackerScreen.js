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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAppContext } from '../context/AppContext';
import { searchFoods, getAvailableUnits } from '../services/foodDatabase';
import { calculatePortionNutrition, formatDate, isToday } from '../utils/calculations';
import FoodCamera from '../components/FoodCamera';
import NutritionSummary from '../components/NutritionSummary';

export default function TrackerScreen() {
  const { state, actions } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('serving');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchFoods(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleDateSelect = (day) => {
    actions.setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    const units = getAvailableUnits(food);
    setSelectedUnit(units[0]);
    setShowAddFood(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddMeal = () => {
    if (!selectedFood || !quantity) return;

    const nutrition = calculatePortionNutrition(selectedFood, parseFloat(quantity), selectedUnit);
    
    const meal = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity: parseFloat(quantity),
      unit: selectedUnit,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      date: state.selectedDate,
      timestamp: new Date().toISOString(),
    };

    actions.addMeal(meal);
    setShowAddFood(false);
    setSelectedFood(null);
    setQuantity('1');
    setSearchQuery('');
  };

  const handleRemoveMeal = (mealId) => {
    Alert.alert(
      'Remove Food',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => actions.removeMeal(mealId) },
      ]
    );
  };

  const renderMealItem = (meal) => (
    <View key={meal.id} style={styles.mealItem}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{meal.foodName}</Text>
        <Text style={styles.mealDetails}>
          {meal.quantity} {meal.unit} • {Math.round(meal.calories)} cal
        </Text>
        <Text style={styles.macros}>
          P: {meal.protein.toFixed(1)}g • C: {meal.carbs.toFixed(1)}g • F: {meal.fat.toFixed(1)}g
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveMeal(meal.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = (food) => (
    <TouchableOpacity
      key={food.id}
      style={styles.searchResult}
      onPress={() => handleFoodSelect(food)}
    >
      <Text style={styles.foodName}>{food.name}</Text>
      <Text style={styles.foodDetails}>
        {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Date Selector */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#f97316" />
            <Text style={styles.dateText}>
              {isToday(state.selectedDate) ? 'Today' : state.selectedDate}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Summary */}
        <NutritionSummary meals={state.meals} />

        {/* Food Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Food</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(true)}
            >
              <Ionicons name="camera" size={24} color="#f97316" />
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map(renderSearchResult)}
            </View>
          )}
        </View>

        {/* Current Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isToday(state.selectedDate) ? "Today's Meals" : `Meals for ${state.selectedDate}`}
          </Text>
          {state.meals.length === 0 ? (
            <Text style={styles.emptyText}>No meals added yet</Text>
          ) : (
            <View style={styles.mealsList}>
              {state.meals.map(renderMealItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [state.selectedDate]: { selected: true, selectedColor: '#f97316' },
            }}
            theme={{
              backgroundColor: '#1e293b',
              calendarBackground: '#1e293b',
              textSectionTitleColor: '#f8fafc',
              selectedDayBackgroundColor: '#f97316',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#f97316',
              dayTextColor: '#f8fafc',
              textDisabledColor: '#64748b',
              monthTextColor: '#f8fafc',
              arrowColor: '#f97316',
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Add Food Modal */}
      <Modal visible={showAddFood} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add {selectedFood?.name}</Text>
            <TouchableOpacity onPress={() => setShowAddFood(false)}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
          
          {selectedFood && (
            <View style={styles.addFoodContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#64748b"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {getAvailableUnits(selectedFood).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        selectedUnit === unit && styles.selectedUnitButton,
                      ]}
                      onPress={() => setSelectedUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          selectedUnit === unit && styles.selectedUnitText,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity style={styles.addButton} onPress={handleAddMeal}>
                <Text style={styles.addButtonText}>Add to Meals</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <FoodCamera
          onClose={() => setShowCamera(false)}
          onFoodDetected={(foods) => {
            setShowCamera(false);
            // Add detected foods to meals
            foods.forEach(food => {
              const meal = {
                ...food,
                id: Date.now() + Math.random(),
                date: state.selectedDate,
                timestamp: new Date().toISOString(),
              };
              actions.addMeal(meal);
            });
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateText: {
    color: '#f8fafc',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 16,
    marginRight: 8,
  },
  cameraButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 200,
  },
  searchResult: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  foodName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  foodDetails: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  mealsList: {
    gap: 8,
  },
  mealItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  mealDetails: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  macros: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addFoodContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 16,
  },
  unitButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedUnitButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  unitText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  selectedUnitText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
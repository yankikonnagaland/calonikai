import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function MealSummary() {
  const { meals, selectedDate, dispatch } = useApp();

  const todaysMeals = meals.filter(meal => meal.date === selectedDate);

  const removeMeal = (mealId) => {
    Alert.alert(
      'Remove Food',
      'Are you sure you want to remove this food item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => dispatch({ type: 'REMOVE_MEAL', payload: mealId })
        }
      ]
    );
  };

  const getTotalNutrition = () => {
    return todaysMeals.reduce((total, meal) => ({
      calories: total.calories + (meal.calories || 0),
      protein: total.protein + (meal.protein || 0),
      carbs: total.carbs + (meal.carbs || 0),
      fat: total.fat + (meal.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totalNutrition = getTotalNutrition();

  const renderMealItem = ({ item }) => (
    <View style={styles.mealItem}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{item.food?.name || 'Unknown Food'}</Text>
        <Text style={styles.mealDetails}>
          {item.quantity} {item.unit} • {Math.round(item.calories || 0)} cal
        </Text>
        <Text style={styles.mealMacros}>
          P: {Math.round(item.protein || 0)}g • C: {Math.round(item.carbs || 0)}g • F: {Math.round(item.fat || 0)}g
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeMeal(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  if (todaysMeals.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="restaurant-outline" size={48} color="#64748b" />
        <Text style={styles.emptyStateText}>No meals logged yet</Text>
        <Text style={styles.emptyStateSubtext}>Add foods to track your nutrition</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total Summary */}
      <View style={styles.totalSummary}>
        <Text style={styles.totalTitle}>Today's Total</Text>
        <View style={styles.totalRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{Math.round(totalNutrition.calories)}</Text>
            <Text style={styles.totalLabel}>Calories</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{Math.round(totalNutrition.protein)}</Text>
            <Text style={styles.totalLabel}>Protein (g)</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{Math.round(totalNutrition.carbs)}</Text>
            <Text style={styles.totalLabel}>Carbs (g)</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{Math.round(totalNutrition.fat)}</Text>
            <Text style={styles.totalLabel}>Fat (g)</Text>
          </View>
        </View>
      </View>

      {/* Meal Items */}
      <FlatList
        data={todaysMeals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.mealsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
  },
  totalSummary: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  totalTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    color: '#f97316',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  mealsList: {
    maxHeight: 300,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealDetails: {
    color: '#f97316',
    fontSize: 14,
    marginBottom: 2,
  },
  mealMacros: {
    color: '#94a3b8',
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
});
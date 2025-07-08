import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function NutritionSummary() {
  const { meals, userProfile, selectedDate } = useApp();

  const todaysMeals = meals.filter(meal => meal.date === selectedDate);

  const getTotalNutrition = () => {
    return todaysMeals.reduce((total, meal) => ({
      calories: total.calories + (meal.calories || 0),
      protein: total.protein + (meal.protein || 0),
      carbs: total.carbs + (meal.carbs || 0),
      fat: total.fat + (meal.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totalNutrition = getTotalNutrition();
  const targetCalories = userProfile?.targetCalories || 2000;
  const targetProtein = userProfile?.proteinTarget || 60;
  const remainingCalories = Math.max(0, targetCalories - totalNutrition.calories);
  
  const calorieProgress = Math.min((totalNutrition.calories / targetCalories) * 100, 100);
  const proteinProgress = Math.min((totalNutrition.protein / targetProtein) * 100, 100);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return "Today's";
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{formatDate(selectedDate)} Nutrition</Text>
      
      {/* Main Calories Card */}
      <View style={styles.mainCard}>
        <View style={styles.calorieInfo}>
          <Text style={styles.calorieValue}>{Math.round(totalNutrition.calories)}</Text>
          <Text style={styles.calorieLabel}>of {targetCalories} calories</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${calorieProgress}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(calorieProgress)}% of target</Text>
        </View>
        
        {remainingCalories > 0 && (
          <Text style={styles.remainingText}>
            {remainingCalories} calories remaining
          </Text>
        )}
      </View>

      {/* Macros Grid */}
      <View style={styles.macrosGrid}>
        <View style={styles.macroCard}>
          <Ionicons name="fitness" size={20} color="#f97316" />
          <Text style={styles.macroValue}>{Math.round(totalNutrition.protein)}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
          <View style={styles.macroProgress}>
            <View 
              style={[styles.macroProgressFill, { width: `${proteinProgress}%` }]} 
            />
          </View>
        </View>

        <View style={styles.macroCard}>
          <Ionicons name="leaf" size={20} color="#10b981" />
          <Text style={styles.macroValue}>{Math.round(totalNutrition.carbs)}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
          <View style={styles.macroProgress}>
            <View 
              style={[styles.macroProgressFill, { width: '0%', backgroundColor: '#10b981' }]} 
            />
          </View>
        </View>

        <View style={styles.macroCard}>
          <Ionicons name="water" size={20} color="#f59e0b" />
          <Text style={styles.macroValue}>{Math.round(totalNutrition.fat)}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
          <View style={styles.macroProgress}>
            <View 
              style={[styles.macroProgressFill, { width: '0%', backgroundColor: '#f59e0b' }]} 
            />
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todaysMeals.length}</Text>
          <Text style={styles.statLabel}>Foods Logged</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(totalNutrition.calories / 4)}</Text>
          <Text style={styles.statLabel}>Avg per Meal</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {totalNutrition.calories > 0 ? Math.round((totalNutrition.protein * 4 / totalNutrition.calories) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>From Protein</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  mainCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  calorieInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  calorieLabel: {
    fontSize: 16,
    color: '#94a3b8',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  remainingText: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 8,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginVertical: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  macroProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    backgroundColor: '#f97316',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
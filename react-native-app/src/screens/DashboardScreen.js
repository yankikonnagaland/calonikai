import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen() {
  const { meals, exercises, userProfile, selectedDate } = useApp();
  const [weeklyData, setWeeklyData] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    generateWeeklyData();
  }, [meals, exercises]);

  const generateWeeklyData = () => {
    // Generate sample weekly data for charts
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const caloriesData = [1800, 2100, 1950, 2250, 1900, 2050, 1850];
    const exerciseData = [300, 450, 200, 500, 350, 400, 250];
    const weightData = [75.2, 75.1, 75.3, 75.0, 74.9, 75.1, 75.0];

    setWeeklyData({
      labels: days,
      calories: caloriesData,
      exercise: exerciseData,
      weight: weightData,
    });
  };

  const getTodaysStats = () => {
    const todaysMeals = meals.filter(meal => meal.date === selectedDate);
    const todaysExercises = exercises.filter(exercise => exercise.date === selectedDate);

    const totalCalories = todaysMeals.reduce((sum, meal) => {
      return sum + (meal.calories || 0);
    }, 0);

    const totalProtein = todaysMeals.reduce((sum, meal) => {
      return sum + (meal.protein || 0);
    }, 0);

    const totalCarbs = todaysMeals.reduce((sum, meal) => {
      return sum + (meal.carbs || 0);
    }, 0);

    const totalFat = todaysMeals.reduce((sum, meal) => {
      return sum + (meal.fat || 0);
    }, 0);

    const caloriesBurned = todaysExercises.reduce((sum, exercise) => {
      return sum + (exercise.caloriesBurned || 0);
    }, 0);

    const targetCalories = userProfile?.targetCalories || 2000;
    const targetProtein = userProfile?.proteinTarget || 60;

    return {
      caloriesIn: Math.round(totalCalories),
      caloriesOut: caloriesBurned,
      netCalories: Math.round(totalCalories - caloriesBurned),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      targetCalories,
      targetProtein,
      calorieProgress: Math.min((totalCalories / targetCalories) * 100, 100),
      proteinProgress: Math.min((totalProtein / targetProtein) * 100, 100),
    };
  };

  const stats = getTodaysStats();

  const chartConfig = {
    backgroundColor: '#1e293b',
    backgroundGradientFrom: '#1e293b',
    backgroundGradientTo: '#1e293b',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(241, 245, 249, ${opacity})`,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#f97316',
    },
  };

  const generateInsights = () => {
    const insights = [];
    
    if (stats.calorieProgress < 80) {
      insights.push({
        type: 'warning',
        message: 'You\'re under your calorie target. Consider adding a healthy snack.',
        icon: 'warning',
      });
    } else if (stats.calorieProgress > 120) {
      insights.push({
        type: 'caution',
        message: 'You\'ve exceeded your calorie target. Great workout opportunity!',
        icon: 'flame',
      });
    } else {
      insights.push({
        type: 'success',
        message: 'Great job staying within your calorie target!',
        icon: 'checkmark-circle',
      });
    }

    if (stats.proteinProgress < 80) {
      insights.push({
        type: 'info',
        message: 'Try to add more protein-rich foods to reach your daily target.',
        icon: 'fitness',
      });
    }

    if (stats.caloriesOut > 0) {
      insights.push({
        type: 'success',
        message: `Awesome! You burned ${stats.caloriesOut} calories through exercise today.`,
        icon: 'trophy',
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Health Dashboard</Text>

        {/* Daily Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.caloriesIn}</Text>
            <Text style={styles.summaryLabel}>Calories In</Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${stats.calorieProgress}%` }]} 
              />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.caloriesOut}</Text>
            <Text style={styles.summaryLabel}>Calories Out</Text>
            <Ionicons name="flame" size={16} color="#f97316" />
          </View>

          <View style={styles.summaryCard}>
            <Text style={[
              styles.summaryValue,
              { color: stats.netCalories > 0 ? '#f97316' : '#10b981' }
            ]}>
              {stats.netCalories > 0 ? '+' : ''}{stats.netCalories}
            </Text>
            <Text style={styles.summaryLabel}>Net Calories</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.protein}g</Text>
            <Text style={styles.summaryLabel}>Protein</Text>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${stats.proteinProgress}%` }]} 
              />
            </View>
          </View>
        </View>

        {/* Macros Breakdown */}
        <View style={styles.macrosContainer}>
          <Text style={styles.sectionTitle}>Today's Macros</Text>
          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <View style={[styles.macroIndicator, { backgroundColor: '#f97316' }]} />
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{stats.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIndicator, { backgroundColor: '#10b981' }]} />
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{stats.carbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIndicator, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{stats.fat}g</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress Chart */}
        {weeklyData && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Weekly Calorie Trend</Text>
            <LineChart
              data={{
                labels: weeklyData.labels,
                datasets: [
                  {
                    data: weeklyData.calories,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Exercise Chart */}
        {weeklyData && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Weekly Exercise</Text>
            <BarChart
              data={{
                labels: weeklyData.labels,
                datasets: [
                  {
                    data: weeklyData.exercise,
                  },
                ],
              }}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              }}
              style={styles.chart}
            />
          </View>
        )}

        {/* AI Insights */}
        <View style={styles.insightsContainer}>
          <TouchableOpacity 
            style={styles.insightsHeader}
            onPress={() => setShowInsights(!showInsights)}
          >
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <Ionicons 
              name={showInsights ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#f1f5f9" 
            />
          </TouchableOpacity>
          
          {showInsights && (
            <View style={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Ionicons 
                    name={insight.icon} 
                    size={20} 
                    color={
                      insight.type === 'success' ? '#10b981' :
                      insight.type === 'warning' ? '#f59e0b' :
                      insight.type === 'caution' ? '#ef4444' : '#3b82f6'
                    } 
                  />
                  <Text style={styles.insightText}>{insight.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle" size={24} color="#f97316" />
              <Text style={styles.actionText}>Add Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="fitness" size={24} color="#f97316" />
              <Text style={styles.actionText}>Log Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="camera" size={24} color="#f97316" />
              <Text style={styles.actionText}>Scan Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="scale" size={24} color="#f97316" />
              <Text style={styles.actionText}>Log Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
  },
  macrosContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  chartContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  insightsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 24,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  insightsList: {
    padding: 16,
    paddingTop: 0,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    color: '#f1f5f9',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  quickActions: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionText: {
    color: '#f1f5f9',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
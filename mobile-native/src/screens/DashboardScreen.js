import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { useAppContext } from '../context/AppContext';
import { calculateMealNutrition, calculateExerciseCalories, isToday } from '../utils/calculations';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { state } = useAppContext();

  const totalNutrition = calculateMealNutrition(state.meals);
  const totalCaloriesBurned = calculateExerciseCalories(state.exercises);
  const netCalories = totalNutrition.calories - totalCaloriesBurned;

  const targetCalories = state.userProfile?.targetCalories || 2000;
  const targetProtein = state.userProfile?.proteinTarget || 60;

  const calorieProgress = Math.min(totalNutrition.calories / targetCalories, 1);
  const proteinProgress = Math.min(totalNutrition.protein / targetProtein, 1);

  const chartConfig = {
    backgroundColor: '#1e293b',
    backgroundGradientFrom: '#1e293b',
    backgroundGradientTo: '#334155',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(248, 250, 252, ${opacity})`,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#f97316',
    },
  };

  // Sample data for weekly trend - in real app this would come from saved data
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [1800, 2100, 1950, 2200, 1900, 2400, totalNutrition.calories || 0],
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const progressData = {
    labels: ['Calories', 'Protein'],
    data: [calorieProgress, proteinProgress],
  };

  const renderSummaryCard = (title, value, unit, icon, color = '#f97316') => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={[styles.summaryValue, { color }]}>
        {typeof value === 'number' ? Math.round(value) : value}
      </Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
    </View>
  );

  const renderMacroCard = (title, value, unit, color) => (
    <View style={styles.macroCard}>
      <Text style={styles.macroTitle}>{title}</Text>
      <Text style={[styles.macroValue, { color }]}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </Text>
      <Text style={styles.macroUnit}>{unit}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isToday(state.selectedDate) ? "Today's Overview" : `Overview for ${state.selectedDate}`}
          </Text>
          <Text style={styles.subtitle}>Track your nutrition and fitness progress</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Summary</Text>
          <View style={styles.summaryGrid}>
            {renderSummaryCard('Calories In', totalNutrition.calories, 'cal', 'restaurant', '#10b981')}
            {renderSummaryCard('Calories Out', totalCaloriesBurned, 'cal', 'flame', '#ef4444')}
            {renderSummaryCard('Net Calories', netCalories, 'cal', 'analytics', '#6366f1')}
            {renderSummaryCard('Weight', state.userProfile?.weight || 'N/A', 'kg', 'scale', '#8b5cf6')}
          </View>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
          <View style={styles.macroGrid}>
            {renderMacroCard('Protein', totalNutrition.protein, 'g', '#10b981')}
            {renderMacroCard('Carbs', totalNutrition.carbs, 'g', '#f59e0b')}
            {renderMacroCard('Fat', totalNutrition.fat, 'g', '#ef4444')}
          </View>
        </View>

        {/* Progress Charts */}
        {state.userProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Progress</Text>
            <View style={styles.chartContainer}>
              <ProgressChart
                data={progressData}
                width={screenWidth - 32}
                height={220}
                strokeWidth={16}
                radius={32}
                chartConfig={chartConfig}
                hideLegend={false}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Calories: {Math.round(totalNutrition.calories)}/{targetCalories} 
                ({Math.round(calorieProgress * 100)}%)
              </Text>
              <Text style={styles.progressLabel}>
                Protein: {totalNutrition.protein.toFixed(1)}g/{targetProtein}g 
                ({Math.round(proteinProgress * 100)}%)
              </Text>
            </View>
          </View>
        )}

        {/* Weekly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Calorie Trend</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={weeklyData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                borderRadius: 8,
              }}
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Meals Logged</Text>
              <Text style={styles.statValue}>{state.meals.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Exercises Done</Text>
              <Text style={styles.statValue}>{state.exercises.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active Minutes</Text>
              <Text style={styles.statValue}>
                {state.exercises.reduce((total, ex) => total + ex.duration, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Setup Prompt */}
        {!state.userProfile && (
          <View style={styles.section}>
            <View style={styles.setupPrompt}>
              <Ionicons name="person-add" size={32} color="#f97316" />
              <Text style={styles.setupTitle}>Complete Your Profile</Text>
              <Text style={styles.setupText}>
                Set up your profile to get personalized calorie and nutrition targets
              </Text>
              <TouchableOpacity style={styles.setupButton}>
                <Text style={styles.setupButtonText}>Set Up Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Motivational Message */}
        <View style={styles.section}>
          <View style={styles.motivationCard}>
            <Ionicons name="trophy" size={24} color="#f59e0b" />
            <Text style={styles.motivationText}>
              {netCalories > 0 
                ? `You're ${Math.abs(netCalories)} calories above your target. Consider adding some exercise!`
                : netCalories < -500
                ? `Great work! You're in a healthy deficit of ${Math.abs(netCalories)} calories.`
                : "Perfect balance! You're right on track with your nutrition goals."
              }
            </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryUnit: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  macroTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  macroUnit: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  progressLabels: {
    marginTop: 12,
    gap: 4,
  },
  progressLabel: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  statValue: {
    color: '#f97316',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  setupPrompt: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  setupTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  setupText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  motivationCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationText: {
    color: '#f8fafc',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
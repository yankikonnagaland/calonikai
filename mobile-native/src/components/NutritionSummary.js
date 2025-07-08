import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateMealNutrition } from '../utils/calculations';

export default function NutritionSummary({ meals = [] }) {
  const nutrition = calculateMealNutrition(meals);

  const renderNutritionCard = (title, value, unit, icon, color) => (
    <View style={styles.nutritionCard}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>
        {typeof value === 'number' ? Math.round(value) : value}
      </Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Summary</Text>
      <View style={styles.nutritionGrid}>
        {renderNutritionCard('Calories', nutrition.calories, 'cal', 'flame', '#f97316')}
        {renderNutritionCard('Protein', nutrition.protein, 'g', 'fitness', '#10b981')}
        {renderNutritionCard('Carbs', nutrition.carbs, 'g', 'leaf', '#f59e0b')}
        {renderNutritionCard('Fat', nutrition.fat, 'g', 'water', '#ef4444')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardUnit: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
});
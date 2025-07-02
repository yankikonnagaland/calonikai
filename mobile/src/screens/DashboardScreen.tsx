import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService, DailySummary } from '../services/api';
import { SessionManager } from '../utils/session';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const sessionId = SessionManager.getSessionId();

  // Get daily summary
  const { data: dailySummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['daily-summary', sessionId, selectedDate],
    queryFn: () => apiService.getDailySummary(sessionId, selectedDate),
    staleTime: 1 * 60 * 1000,
  });

  // Get user profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', sessionId],
    queryFn: () => apiService.getUserProfile(sessionId),
    staleTime: 5 * 60 * 1000,
  });

  // Get meal items for today
  const { data: mealItems = [] } = useQuery({
    queryKey: ['meal-items', sessionId, selectedDate],
    queryFn: () => apiService.getMealItems(sessionId, selectedDate),
    staleTime: 1 * 60 * 1000,
  });

  const calculateProgress = () => {
    if (!dailySummary || !userProfile?.targetCalories) {
      return 0;
    }
    return (dailySummary.totalCalories / userProfile.targetCalories) * 100;
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress > 110) return '#EF4444'; // Red
    if (progress > 90) return '#F59E0B'; // Yellow
    return '#10B981'; // Green
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoadingSummary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
      </View>

      {/* Daily Progress */}
      {userProfile?.targetCalories && (
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Daily Goal Progress</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {dailySummary?.totalCalories || 0} / {userProfile.targetCalories} cal
                </Text>
                <Text style={[styles.progressPercent, { color: getProgressColor() }]}>
                  {Math.round(calculateProgress())}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(calculateProgress(), 100)}%`,
                        backgroundColor: getProgressColor(),
                      },
                    ]}
                  />
                </View>
              </View>
              
              <View style={styles.remainingCalories}>
                <Text style={styles.remainingText}>
                  {userProfile.targetCalories - (dailySummary?.totalCalories || 0) > 0
                    ? `${userProfile.targetCalories - (dailySummary?.totalCalories || 0)} cal remaining`
                    : `${(dailySummary?.totalCalories || 0) - userProfile.targetCalories} cal over target`
                  }
                </Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Nutrition Summary */}
      {dailySummary && (
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Today's Nutrition</Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionCard}>
                <Icon name="local-fire-department" size={24} color="#EF4444" />
                <Text style={styles.nutritionValue}>{Math.round(dailySummary.totalCalories)}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              
              <View style={styles.nutritionCard}>
                <Icon name="fitness-center" size={24} color="#10B981" />
                <Text style={styles.nutritionValue}>{Math.round(dailySummary.totalProtein)}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              
              <View style={styles.nutritionCard}>
                <Icon name="grain" size={24} color="#F59E0B" />
                <Text style={styles.nutritionValue}>{Math.round(dailySummary.totalCarbs)}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              
              <View style={styles.nutritionCard}>
                <Icon name="opacity" size={24} color="#8B5CF6" />
                <Text style={styles.nutritionValue}>{Math.round(dailySummary.totalFat)}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Today's Meals */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Today's Food Items</Text>
          
          {mealItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="restaurant" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Start tracking your food in the Tracker tab</Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {mealItems.map((item, index) => (
                <View key={index} style={styles.mealItem}>
                  <View style={styles.mealItemContent}>
                    <Text style={styles.mealItemName}>{item.food.name}</Text>
                    <Text style={styles.mealItemDetails}>
                      {item.quantity} {item.unit} • {Math.round(item.food.calories)} cal
                    </Text>
                  </View>
                  <View style={styles.mealItemMacros}>
                    <Text style={styles.macroText}>P: {Math.round(item.food.protein)}g</Text>
                    <Text style={styles.macroText}>C: {Math.round(item.food.carbs)}g</Text>
                    <Text style={styles.macroText}>F: {Math.round(item.food.fat)}g</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Icon name="camera-alt" size={32} color="#6366F1" />
              <Text style={styles.actionText}>Scan Food</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Icon name="search" size={32} color="#10B981" />
              <Text style={styles.actionText}>Search Food</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Icon name="fitness-center" size={32} color="#F59E0B" />
              <Text style={styles.actionText}>Log Exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Icon name="person" size={32} color="#8B5CF6" />
              <Text style={styles.actionText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Health Insights */}
      {userProfile && dailySummary && (
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Health Insights</Text>
            
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Icon name="info" size={20} color="#6366F1" />
                <Text style={styles.insightText}>
                  {dailySummary.totalCalories > (userProfile.targetCalories || 0)
                    ? 'You\'re over your calorie target today. Consider lighter meals for dinner.'
                    : 'Good job staying within your calorie target! Keep it up.'
                  }
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <Icon name="fitness-center" size={20} color="#10B981" />
                <Text style={styles.insightText}>
                  Protein intake: {Math.round(dailySummary.totalProtein)}g. 
                  {dailySummary.totalProtein < 50 
                    ? ' Consider adding more protein-rich foods.'
                    : ' Great protein intake for muscle maintenance!'
                  }
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <Icon name="local-drink" size={20} color="#3B82F6" />
                <Text style={styles.insightText}>
                  Remember to stay hydrated! Aim for 8-10 glasses of water daily.
                </Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
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
  card: {
    backgroundColor: '#1E293B',
    marginBottom: 16,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingCalories: {
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionCard: {
    width: (width - 64) / 2,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginTop: 8,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  mealsList: {
    gap: 12,
  },
  mealItem: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
  },
  mealItemContent: {
    marginBottom: 8,
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
  mealItemMacros: {
    flexDirection: 'row',
    gap: 16,
  },
  macroText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 2,
    backgroundColor: '#334155',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginTop: 8,
    textAlign: 'center',
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default DashboardScreen;
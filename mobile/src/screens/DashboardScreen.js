import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [profile, setProfile] = useState(null);

  const API_BASE = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getSessionId = async () => {
    let sessionId = await AsyncStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const sessionId = await getSessionId();
      const today = new Date().toISOString().split('T')[0];

      // Load daily summary
      const summaryResponse = await fetch(`${API_BASE}/daily-summary/${sessionId}/${today}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setDailySummary(summaryData);
      }

      // Load profile
      const profileResponse = await fetch(`${API_BASE}/profile/${sessionId}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Load weekly data for trends
      const weeklyResponse = await fetch(`${API_BASE}/daily-summaries/${sessionId}`);
      if (weeklyResponse.ok) {
        const weeklyData = await weeklyResponse.json();
        setWeeklyData(weeklyData.slice(-7)); // Last 7 days
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = (current, target, color = '#3B82F6') => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const renderWeeklyChart = () => {
    const maxCalories = Math.max(...weeklyData.map(day => day.calories || 0), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Calorie Intake</Text>
        <View style={styles.chartBars}>
          {weeklyData.map((day, index) => {
            const height = ((day.calories || 0) / maxCalories) * 100;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: `${height}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{dayName}</Text>
                <Text style={styles.barValue}>{Math.round(day.calories || 0)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Dashboard</Text>
          <Text style={styles.subtitle}>Track your nutrition progress</Text>
        </View>

        {/* Today's Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          
          {dailySummary ? (
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>{Math.round(dailySummary.calories || 0)}</Text>
                <Text style={styles.overviewLabel}>Calories In</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>{Math.round(dailySummary.caloriesBurned || 0)}</Text>
                <Text style={styles.overviewLabel}>Calories Out</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>{Math.round((dailySummary.calories || 0) - (dailySummary.caloriesBurned || 0))}</Text>
                <Text style={styles.overviewLabel}>Net Calories</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>{Math.round(dailySummary.protein || 0)}g</Text>
                <Text style={styles.overviewLabel}>Protein</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No data for today yet. Start tracking!</Text>
          )}
        </View>

        {/* Goals Progress */}
        {profile && (
          <View style={styles.goalsCard}>
            <Text style={styles.cardTitle}>Goal Progress</Text>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Daily Calories</Text>
                <Text style={styles.goalValues}>
                  {Math.round(dailySummary?.calories || 0)} / {Math.round(profile.targetCalories || 0)}
                </Text>
              </View>
              {renderProgressBar(dailySummary?.calories || 0, profile.targetCalories || 0)}
            </View>

            {profile.dailyProteinTarget && (
              <View style={styles.goalItem}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalLabel}>Daily Protein</Text>
                  <Text style={styles.goalValues}>
                    {Math.round(dailySummary?.protein || 0)}g / {Math.round(profile.dailyProteinTarget)}g
                  </Text>
                </View>
                {renderProgressBar(dailySummary?.protein || 0, profile.dailyProteinTarget, '#22C55E')}
              </View>
            )}
          </View>
        )}

        {/* Weekly Trends */}
        {weeklyData.length > 0 && (
          <View style={styles.trendsCard}>
            {renderWeeklyChart()}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.actionEmoji}>🍽️</Text>
              <Text style={styles.actionText}>Add Food</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Text style={styles.actionEmoji}>📷</Text>
              <Text style={styles.actionText}>AI Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Exercise')}
            >
              <Text style={styles.actionEmoji}>💪</Text>
              <Text style={styles.actionText}>Log Exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.actionEmoji}>👤</Text>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Section */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>Keep Going! 💪</Text>
          <Text style={styles.motivationText}>
            {dailySummary?.calories > 0 
              ? "Great job tracking your nutrition today! Every healthy choice counts." 
              : "Start your day right by logging your first meal. You've got this!"
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  overviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  goalsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goalValues: {
    fontSize: 14,
    color: '#94A3B8',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    minWidth: 35,
  },
  trendsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    width: '100%',
  },
  chartBar: {
    alignItems: 'center',
    width: 35,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: '#64748B',
  },
  actionsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  motivationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
  },
});

export default DashboardScreen;
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ user, sessionId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySummary, setDailySummary] = useState(null);
  const [dailyWeight, setDailyWeight] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dateString = selectedDate.toISOString().split('T')[0];
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate, sessionId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load daily summary
      const summary = await ApiService.getDailySummary(sessionId, dateString);
      setDailySummary(summary);
      
      // Load daily weight
      const weight = await ApiService.getDailyWeight(sessionId, dateString);
      setDailyWeight(weight);
      
      // Load weekly data for trends (last 7 days)
      await loadWeeklyTrends();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const [summary, weight] = await Promise.all([
            ApiService.getDailySummary(sessionId, dateStr).catch(() => null),
            ApiService.getDailyWeight(sessionId, dateStr).catch(() => null)
          ]);
          
          trends.push({
            date: dateStr,
            shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            calories: summary?.totalCalories || 0,
            caloriesBurned: summary?.caloriesBurned || 0,
            weight: weight?.weight || null,
          });
        } catch (error) {
          trends.push({
            date: dateStr,
            shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            calories: 0,
            caloriesBurned: 0,
            weight: null,
          });
        }
      }
      
      setWeeklyData(trends);
    } catch (error) {
      console.error('Error loading weekly trends:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Calculate nutrition metrics
  const caloriesIn = dailySummary?.totalCalories || 0;
  const caloriesOut = dailySummary?.caloriesBurned || 0;
  const netCalories = caloriesIn - caloriesOut;
  const protein = dailySummary?.totalProtein || 0;
  const carbs = dailySummary?.totalCarbs || 0;
  const fat = dailySummary?.totalFat || 0;

  // Get max values for chart scaling
  const maxCalories = Math.max(...weeklyData.map(d => Math.max(d.calories, d.caloriesBurned)), 1);
  const maxWeight = Math.max(...weeklyData.map(d => d.weight || 0), 1);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>
            {isToday ? 'Today' : selectedDate.toLocaleDateString()}
          </Text>
          <Text style={styles.dateSubtext}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Daily Summary Cards */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>
          {isToday ? "Today's Summary" : "Daily Summary"}
        </Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="arrow-down" size={20} color="#10b981" />
              <Text style={styles.metricLabel}>Calories In</Text>
            </View>
            <Text style={styles.metricValue}>{caloriesIn}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="arrow-up" size={20} color="#ef4444" />
              <Text style={styles.metricLabel}>Calories Out</Text>
            </View>
            <Text style={styles.metricValue}>{caloriesOut}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="calculator" size={20} color="#3b82f6" />
              <Text style={styles.metricLabel}>Net Calories</Text>
            </View>
            <Text style={[styles.metricValue, { color: netCalories > 0 ? '#10b981' : '#ef4444' }]}>
              {netCalories > 0 ? '+' : ''}{netCalories}
            </Text>
          </View>

          {dailyWeight && (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="fitness" size={20} color="#f59e0b" />
                <Text style={styles.metricLabel}>Weight</Text>
              </View>
              <Text style={styles.metricValue}>{dailyWeight.weight} kg</Text>
            </View>
          )}
        </View>
      </View>

      {/* Macronutrients */}
      {(protein > 0 || carbs > 0 || fat > 0) && (
        <View style={styles.macrosContainer}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
          <View style={styles.macrosGrid}>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{protein.toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={[styles.macroBar, { backgroundColor: '#10b981' }]} />
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{carbs.toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={[styles.macroBar, { backgroundColor: '#3b82f6' }]} />
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{fat.toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={[styles.macroBar, { backgroundColor: '#f59e0b' }]} />
            </View>
          </View>
        </View>
      )}

      {/* Weekly Trends Chart */}
      <View style={styles.trendsContainer}>
        <Text style={styles.sectionTitle}>7-Day Trends</Text>
        
        {/* Calories Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Calories In vs Out</Text>
          <View style={styles.chart}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBars}>
                  {/* Calories In Bar */}
                  <View 
                    style={[
                      styles.chartBar,
                      styles.caloriesInBar,
                      { 
                        height: Math.max((day.calories / maxCalories) * 80, 2),
                      }
                    ]} 
                  />
                  {/* Calories Out Bar */}
                  <View 
                    style={[
                      styles.chartBar,
                      styles.caloriesOutBar,
                      { 
                        height: Math.max((day.caloriesBurned / maxCalories) * 80, 2),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartDayLabel}>{day.shortDate}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Calories In</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Calories Out</Text>
            </View>
          </View>
        </View>

        {/* Weight Chart */}
        {weeklyData.some(day => day.weight) && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Weight Trend</Text>
            <View style={styles.chart}>
              {weeklyData.map((day, index) => (
                <View key={index} style={styles.chartDay}>
                  <View style={styles.chartBars}>
                    {day.weight && (
                      <View 
                        style={[
                          styles.chartBar,
                          styles.weightBar,
                          { 
                            height: Math.max((day.weight / maxWeight) * 80, 2),
                          }
                        ]} 
                      />
                    )}
                  </View>
                  <Text style={styles.chartDayLabel}>{day.shortDate}</Text>
                  {day.weight && (
                    <Text style={styles.chartDayValue}>{day.weight.toFixed(1)}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="restaurant" size={24} color="#10b981" />
            <Text style={styles.actionButtonText}>Add Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="fitness" size={24} color="#f59e0b" />
            <Text style={styles.actionButtonText}>Log Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="scale" size={24} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Update Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="camera" size={24} color="#8b5cf6" />
            <Text style={styles.actionButtonText}>Scan Food</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  navButton: {
    padding: 8,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateSubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
  summaryContainer: {
    padding: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    width: (width - 44) / 2,
    minHeight: 80,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 8,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  macrosContainer: {
    padding: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  macroValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  macroLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  macroBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  trendsContainer: {
    padding: 16,
  },
  chartContainer: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginBottom: 16,
  },
  chartDay: {
    flex: 1,
    alignItems: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 8,
  },
  chartBar: {
    width: 8,
    borderRadius: 2,
    minHeight: 2,
  },
  caloriesInBar: {
    backgroundColor: '#10b981',
  },
  caloriesOutBar: {
    backgroundColor: '#ef4444',
  },
  weightBar: {
    backgroundColor: '#3b82f6',
    width: 12,
  },
  chartDayLabel: {
    color: '#9ca3af',
    fontSize: 10,
  },
  chartDayValue: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  actionsContainer: {
    padding: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 44) / 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionButtonText: {
    color: '#ffffff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
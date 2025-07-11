import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExerciseScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const API_BASE = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api';

  const commonActivities = [
    { name: 'Walking', caloriesPerMinute: 4 },
    { name: 'Running', caloriesPerMinute: 10 },
    { name: 'Cycling', caloriesPerMinute: 8 },
    { name: 'Swimming', caloriesPerMinute: 12 },
    { name: 'Weight Training', caloriesPerMinute: 6 },
    { name: 'Yoga', caloriesPerMinute: 3 },
    { name: 'Dancing', caloriesPerMinute: 5 },
    { name: 'Basketball', caloriesPerMinute: 9 },
  ];

  useEffect(() => {
    loadTodaysExercises();
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  const getSessionId = async () => {
    let sessionId = await AsyncStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const loadTodaysExercises = async () => {
    try {
      const sessionId = await getSessionId();
      const response = await fetch(`${API_BASE}/exercise/${sessionId}`);
      const exercisesData = await response.json();
      
      // Filter for today's exercises
      const today = new Date().toISOString().split('T')[0];
      const todaysExercises = exercisesData.filter(exercise => {
        const exerciseDate = new Date(exercise.createdAt).toISOString().split('T')[0];
        return exerciseDate === today;
      });
      
      setExercises(todaysExercises);
      
      // Calculate total calories burned
      const totalCalories = todaysExercises.reduce((sum, exercise) => {
        return sum + (exercise.caloriesBurned || 0);
      }, 0);
      setTotalCaloriesBurned(totalCalories);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerDuration(0);
    
    const interval = setInterval(() => {
      setTimerDuration(prev => prev + 1);
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Set duration from timer
    const minutes = Math.floor(timerDuration / 60);
    setDuration(minutes.toString());
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerDuration(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateCalories = (activity, duration) => {
    const activityData = commonActivities.find(a => a.name === activity);
    if (activityData && duration) {
      return Math.round(activityData.caloriesPerMinute * parseFloat(duration));
    }
    return 0;
  };

  const logExercise = async () => {
    if (!activityName || !duration) {
      Alert.alert('Error', 'Please enter activity name and duration');
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = await getSessionId();
      const caloriesBurned = calculateCalories(activityName, duration);
      
      const response = await fetch(`${API_BASE}/exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          sessionId,
          exerciseName: activityName,
          duration: parseInt(duration),
          caloriesBurned,
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `${activityName} logged! You burned ${caloriesBurned} calories.`);
        setActivityName('');
        setDuration('');
        resetTimer();
        loadTodaysExercises();
      } else {
        Alert.alert('Error', 'Failed to log exercise');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log exercise');
      console.error('Exercise log error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExercise = async (exerciseId) => {
    try {
      const response = await fetch(`${API_BASE}/exercise/${exerciseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        Alert.alert('Success', 'Exercise deleted');
        loadTodaysExercises();
      } else {
        Alert.alert('Error', 'Failed to delete exercise');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete exercise');
      console.error('Delete exercise error:', error);
    }
  };

  const selectActivity = (activity) => {
    setActivityName(activity.name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Exercise Tracker</Text>
          <Text style={styles.subtitle}>Log your workouts and activities</Text>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Activity</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalCaloriesBurned}</Text>
              <Text style={styles.statLabel}>Calories Burned</Text>
            </View>
          </View>
        </View>

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <Text style={styles.sectionTitle}>Workout Timer</Text>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatTime(timerDuration)}</Text>
          </View>
          <View style={styles.timerControls}>
            {!isTimerRunning ? (
              <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                <Text style={styles.startButtonText}>Start Timer</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
                <Text style={styles.stopButtonText}>Stop Timer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Activities */}
        <View style={styles.activitiesCard}>
          <Text style={styles.sectionTitle}>Quick Select</Text>
          <View style={styles.activitiesGrid}>
            {commonActivities.map((activity, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.activityButton,
                  activityName === activity.name && styles.activityButtonSelected
                ]}
                onPress={() => selectActivity(activity)}
              >
                <Text style={[
                  styles.activityButtonText,
                  activityName === activity.name && styles.activityButtonTextSelected
                ]}>
                  {activity.name}
                </Text>
                <Text style={styles.activityCalories}>
                  {activity.caloriesPerMinute} cal/min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Log Exercise Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Log Exercise</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter activity name..."
              placeholderTextColor="#94A3B8"
              value={activityName}
              onChangeText={setActivityName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter duration..."
              placeholderTextColor="#94A3B8"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          {activityName && duration && (
            <View style={styles.estimateCard}>
              <Text style={styles.estimateText}>
                Estimated calories: {calculateCalories(activityName, duration)} cal
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.logButton, isLoading && styles.logButtonDisabled]}
            onPress={logExercise}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.logButtonText}>Log Exercise</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's Exercises */}
        <View style={styles.exercisesCard}>
          <Text style={styles.sectionTitle}>Today's Exercises</Text>
          {exercises.length === 0 ? (
            <Text style={styles.emptyText}>No exercises logged today</Text>
          ) : (
            exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.duration} min • {exercise.caloriesBurned} cal burned
                  </Text>
                  <Text style={styles.exerciseTime}>
                    {new Date(exercise.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteExercise(exercise.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F97316',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  timerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timerDisplay: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#64748B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activitiesCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  activityButtonSelected: {
    backgroundColor: '#F97316',
  },
  activityButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  activityButtonTextSelected: {
    color: '#FFFFFF',
  },
  activityCalories: {
    color: '#94A3B8',
    fontSize: 12,
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  estimateCard: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  estimateText: {
    color: '#F97316',
    fontWeight: '600',
  },
  logButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logButtonDisabled: {
    backgroundColor: '#64748B',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exercisesCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  exerciseItem: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  exerciseTime: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExerciseScreen;
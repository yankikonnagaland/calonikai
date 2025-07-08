import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { calculateExerciseCalories } from '../utils/calculations';

export default function ExerciseScreen() {
  const { exercises, userProfile, selectedDate, dispatch } = useApp();
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    duration: '',
    intensity: 'moderate',
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setStartTime(new Date());
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    const durationMinutes = Math.floor(timerSeconds / 60);
    setExerciseForm(prev => ({ ...prev, duration: durationMinutes.toString() }));
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setStartTime(null);
    setExerciseForm(prev => ({ ...prev, duration: '' }));
  };

  const addExercise = () => {
    if (!exerciseForm.name || !exerciseForm.duration) {
      Alert.alert('Error', 'Please fill in exercise name and duration');
      return;
    }

    const duration = parseInt(exerciseForm.duration);
    const weight = userProfile?.weight || 70;
    const caloriesBurned = calculateExerciseCalories(exerciseForm.name, duration, weight, exerciseForm.intensity);

    const exercise = {
      id: Date.now(),
      name: exerciseForm.name,
      duration,
      intensity: exerciseForm.intensity,
      caloriesBurned: Math.round(caloriesBurned),
      date: selectedDate,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_EXERCISE', payload: exercise });
    
    // Reset form
    setExerciseForm({ name: '', duration: '', intensity: 'moderate' });
    resetTimer();
    
    Alert.alert('Success', `Added ${exercise.name} - ${exercise.caloriesBurned} calories burned!`);
  };

  const removeExercise = (exerciseId) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => dispatch({ type: 'REMOVE_EXERCISE', payload: exerciseId })
        }
      ]
    );
  };

  const intensityLevels = [
    { value: 'low', label: 'Low 😌', multiplier: 0.8 },
    { value: 'moderate', label: 'Moderate 💪', multiplier: 1.0 },
    { value: 'high', label: 'High 🔥', multiplier: 1.3 },
  ];

  const popularExercises = [
    'Running', 'Walking', 'Cycling', 'Swimming', 'Weight Training',
    'Yoga', 'Dancing', 'Basketball', 'Football', 'Tennis'
  ];

  const todaysExercises = exercises.filter(exercise => exercise.date === selectedDate);
  const totalCaloriesBurned = todaysExercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Exercise Tracker</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{todaysExercises.length}</Text>
            <Text style={styles.summaryLabel}>Exercises</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCaloriesBurned}</Text>
            <Text style={styles.summaryLabel}>Calories Burned</Text>
          </View>
        </View>

        {/* Exercise Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Add Exercise</Text>
          
          {/* Exercise Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Exercise</Text>
            <TextInput
              style={styles.input}
              value={exerciseForm.name}
              onChangeText={(value) => setExerciseForm(prev => ({ ...prev, name: value }))}
              placeholder="Enter exercise name"
              placeholderTextColor="#64748b"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseChips}>
              {popularExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise}
                  style={styles.exerciseChip}
                  onPress={() => setExerciseForm(prev => ({ ...prev, name: exercise }))}
                >
                  <Text style={styles.exerciseChipText}>{exercise}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Timer */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time Tracking</Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
              <View style={styles.timerButtons}>
                {!isTimerRunning ? (
                  <TouchableOpacity style={styles.timerButton} onPress={startTimer}>
                    <Ionicons name="play" size={24} color="#ffffff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.timerButton, styles.stopButton]} onPress={stopTimer}>
                    <Ionicons name="pause" size={24} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.timerButton, styles.resetButton]} onPress={resetTimer}>
                  <Ionicons name="refresh" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Duration Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={exerciseForm.duration}
              onChangeText={(value) => setExerciseForm(prev => ({ ...prev, duration: value }))}
              placeholder="30"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          {/* Intensity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Intensity Level</Text>
            <View style={styles.intensityContainer}>
              {intensityLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.intensityButton,
                    exerciseForm.intensity === level.value && styles.intensityButtonActive
                  ]}
                  onPress={() => setExerciseForm(prev => ({ ...prev, intensity: level.value }))}
                >
                  <Text style={[
                    styles.intensityButtonText,
                    exerciseForm.intensity === level.value && styles.intensityButtonTextActive
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addExercise}>
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>Log Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Exercises */}
        <View style={styles.exercisesList}>
          <Text style={styles.sectionTitle}>Today's Exercises</Text>
          {todaysExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateText}>No exercises logged today</Text>
              <Text style={styles.emptyStateSubtext}>Start tracking your workouts!</Text>
            </View>
          ) : (
            todaysExercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.duration} min • {exercise.intensity} intensity • {exercise.caloriesBurned} cal
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExercise(exercise.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  formContainer: {
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
  },
  exerciseChips: {
    marginTop: 8,
  },
  exerciseChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseChipText: {
    color: '#f1f5f9',
    fontSize: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
    fontFamily: 'monospace',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    backgroundColor: '#f97316',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  resetButton: {
    backgroundColor: '#64748b',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  intensityButtonText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  intensityButtonTextActive: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  exercisesList: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    color: '#94a3b8',
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
});
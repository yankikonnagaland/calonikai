import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';
import CalendarPicker from '../components/CalendarPicker';

export default function ExerciseScreen({ user, sessionId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    duration: '',
    intensity: 'moderate',
    calories: 0,
  });
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    loadExercises();
  }, [selectedDate, sessionId]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - timerStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const exerciseData = await ApiService.getExercises(sessionId, dateString);
      setExercises(exerciseData || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    setTimerStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (timerStartTime) {
      const finalDuration = Math.round(elapsedTime / 1000 / 60); // Convert to minutes
      setExerciseForm({
        ...exerciseForm,
        duration: finalDuration.toString()
      });
      calculateCalories(exerciseForm.name, finalDuration, exerciseForm.intensity);
    }
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    setExerciseForm({
      ...exerciseForm,
      duration: '',
      calories: 0
    });
  };

  const calculateCalories = (activity, durationMinutes, intensity) => {
    // Basic calorie calculation (can be enhanced with more specific data)
    const baseCaloriesPerMinute = {
      'walking': 5,
      'running': 12,
      'cycling': 8,
      'swimming': 10,
      'weight training': 6,
      'yoga': 3,
      'gym workout': 8,
      'cardio': 10,
      'strength training': 6,
    };

    const intensityMultipliers = {
      'low': 0.7,
      'moderate': 1.0,
      'high': 1.3,
    };

    const activityKey = Object.keys(baseCaloriesPerMinute).find(key => 
      activity.toLowerCase().includes(key)
    ) || 'gym workout';

    const baseCalories = baseCaloriesPerMinute[activityKey] || 6;
    const multiplier = intensityMultipliers[intensity] || 1.0;
    const totalCalories = Math.round(baseCalories * durationMinutes * multiplier);

    setExerciseForm({
      ...exerciseForm,
      calories: totalCalories
    });
  };

  const addExercise = async () => {
    if (!exerciseForm.name.trim() || !exerciseForm.duration) {
      Alert.alert('Error', 'Please fill in exercise name and duration');
      return;
    }

    try {
      const exerciseData = {
        sessionId,
        date: dateString,
        exerciseName: exerciseForm.name,
        duration: parseInt(exerciseForm.duration),
        intensity: exerciseForm.intensity,
        caloriesBurned: exerciseForm.calories,
      };

      await ApiService.addExercise(exerciseData);
      await loadExercises();
      
      // Reset form
      setExerciseForm({
        name: '',
        duration: '',
        intensity: 'moderate',
        calories: 0,
      });
      
      Alert.alert('Success', 'Exercise added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add exercise');
      console.error('Add exercise error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate total calories burned today
  const totalCaloriesBurned = exercises.reduce((total, exercise) => 
    total + (exercise.caloriesBurned || 0), 0
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Date Picker */}
      <View style={styles.dateContainer}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons name="calendar" size={20} color="#f97316" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerTitle}>Exercise Timer</Text>
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>
            {isTimerRunning ? formatTime(elapsedTime) : '00:00'}
          </Text>
        </View>
        <View style={styles.timerControls}>
          {!isTimerRunning ? (
            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <Ionicons name="play" size={24} color="#ffffff" />
              <Text style={styles.timerButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
              <Ionicons name="stop" size={24} color="#ffffff" />
              <Text style={styles.timerButtonText}>Stop</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
            <Ionicons name="refresh" size={24} color="#ffffff" />
            <Text style={styles.timerButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Exercise Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Log Exercise</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Exercise Name</Text>
          <TextInput
            style={styles.textInput}
            value={exerciseForm.name}
            onChangeText={(text) => {
              setExerciseForm({...exerciseForm, name: text});
              if (exerciseForm.duration) {
                calculateCalories(text, parseInt(exerciseForm.duration), exerciseForm.intensity);
              }
            }}
            placeholder="e.g., Running, Gym workout, Yoga"
            placeholderTextColor="#6b7280"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.textInput}
            value={exerciseForm.duration}
            onChangeText={(text) => {
              setExerciseForm({...exerciseForm, duration: text});
              if (text && exerciseForm.name) {
                calculateCalories(exerciseForm.name, parseInt(text), exerciseForm.intensity);
              }
            }}
            placeholder="Enter duration in minutes"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Intensity Level</Text>
          <View style={styles.intensityContainer}>
            {[
              { key: 'low', label: 'Low 😌', color: '#10b981' },
              { key: 'moderate', label: 'Moderate 💪', color: '#f59e0b' },
              { key: 'high', label: 'High 🔥', color: '#ef4444' },
            ].map((intensity) => (
              <TouchableOpacity
                key={intensity.key}
                style={[
                  styles.intensityButton,
                  { borderColor: intensity.color },
                  exerciseForm.intensity === intensity.key && { backgroundColor: intensity.color }
                ]}
                onPress={() => {
                  setExerciseForm({...exerciseForm, intensity: intensity.key});
                  if (exerciseForm.name && exerciseForm.duration) {
                    calculateCalories(exerciseForm.name, parseInt(exerciseForm.duration), intensity.key);
                  }
                }}
              >
                <Text style={[
                  styles.intensityButtonText,
                  exerciseForm.intensity === intensity.key && styles.intensityButtonTextActive
                ]}>
                  {intensity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {exerciseForm.calories > 0 && (
          <View style={styles.caloriesPreview}>
            <Text style={styles.caloriesText}>
              Estimated calories burned: {exerciseForm.calories} cal
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.addButton} onPress={addExercise}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>
          {selectedDate.toDateString() === new Date().toDateString() ? 
            "Today's Activity" : 
            `${selectedDate.toLocaleDateString()} Activity`}
        </Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{exercises.length}</Text>
            <Text style={styles.summaryLabel}>Exercises</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {exercises.reduce((total, ex) => total + (ex.duration || 0), 0)}
            </Text>
            <Text style={styles.summaryLabel}>Minutes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCaloriesBurned}</Text>
            <Text style={styles.summaryLabel}>Calories Burned</Text>
          </View>
        </View>
      </View>

      {/* Exercise History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Exercise History</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading exercises...</Text>
        ) : exercises.length === 0 ? (
          <Text style={styles.emptyText}>No exercises logged for this date</Text>
        ) : (
          exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <View style={styles.exerciseIcon}>
                <Ionicons name="fitness" size={24} color="#f97316" />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.exerciseName || exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.duration} min • {exercise.intensity} intensity • {exercise.caloriesBurned} cal
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide">
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  dateContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dateText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  timerContainer: {
    padding: 20,
    backgroundColor: '#1f2937',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timerDisplay: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  timerText: {
    color: '#f97316',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButton: {
    backgroundColor: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timerButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#1f2937',
    margin: 16,
    borderRadius: 12,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  intensityButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  intensityButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  caloriesPreview: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  caloriesText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#f97316',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  historyContainer: {
    padding: 16,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  loadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseIcon: {
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseDetails: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
});
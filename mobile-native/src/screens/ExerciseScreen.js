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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAppContext } from '../context/AppContext';
import { formatDate, isToday } from '../utils/calculations';

const exerciseDatabase = [
  { id: 1, name: 'Running', calories: 10, category: 'cardio' },
  { id: 2, name: 'Walking', calories: 5, category: 'cardio' },
  { id: 3, name: 'Cycling', calories: 8, category: 'cardio' },
  { id: 4, name: 'Swimming', calories: 12, category: 'cardio' },
  { id: 5, name: 'Yoga', calories: 3, category: 'flexibility' },
  { id: 6, name: 'Weight Training', calories: 6, category: 'strength' },
  { id: 7, name: 'Push-ups', calories: 8, category: 'strength' },
  { id: 8, name: 'Squats', calories: 8, category: 'strength' },
  { id: 9, name: 'Jumping Jacks', calories: 10, category: 'cardio' },
  { id: 10, name: 'Plank', calories: 5, category: 'core' },
  { id: 11, name: 'Burpees', calories: 15, category: 'cardio' },
  { id: 12, name: 'Mountain Climbers', calories: 12, category: 'cardio' },
];

export default function ExerciseScreen() {
  const { state, actions } = useAppContext();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Timer effect
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

  const handleDateSelect = (day) => {
    actions.setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setShowAddExercise(true);
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setStartTime(new Date());
    setTimerSeconds(0);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    const endTime = new Date();
    const durationMinutes = Math.round(timerSeconds / 60);
    setDuration(durationMinutes.toString());
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setStartTime(null);
    setDuration('');
  };

  const calculateCaloriesBurned = () => {
    if (!selectedExercise || !duration) return 0;
    
    const intensityMultiplier = {
      low: 0.7,
      moderate: 1.0,
      high: 1.3,
    };
    
    const baseCal = selectedExercise.calories * parseFloat(duration);
    return Math.round(baseCal * intensityMultiplier[intensity]);
  };

  const handleAddExercise = () => {
    if (!selectedExercise || !duration) {
      Alert.alert('Error', 'Please select an exercise and enter duration');
      return;
    }

    const caloriesBurned = calculateCaloriesBurned();
    
    const exercise = {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      duration: parseFloat(duration),
      intensity,
      caloriesBurned,
      date: state.selectedDate,
      timestamp: new Date().toISOString(),
      startTime: startTime?.toISOString(),
      endTime: new Date().toISOString(),
    };

    actions.addExercise(exercise);
    setShowAddExercise(false);
    setSelectedExercise(null);
    setDuration('');
    setIntensity('moderate');
    handleResetTimer();
    
    Alert.alert('Success', `Added ${selectedExercise.name} - ${caloriesBurned} calories burned!`);
  };

  const handleRemoveExercise = (exerciseId) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => actions.removeExercise(exerciseId) },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalCaloriesBurned = () => {
    return state.exercises.reduce((total, exercise) => total + exercise.caloriesBurned, 0);
  };

  const renderExerciseItem = (exercise) => (
    <View key={exercise.id} style={styles.exerciseItem}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
        <Text style={styles.exerciseDetails}>
          {exercise.duration} min • {exercise.intensity} intensity • {exercise.caloriesBurned} cal
        </Text>
        <Text style={styles.exerciseTime}>
          {new Date(exercise.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveExercise(exercise.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  const renderExerciseOption = (exercise) => (
    <TouchableOpacity
      key={exercise.id}
      style={styles.exerciseOption}
      onPress={() => handleExerciseSelect(exercise)}
    >
      <View style={styles.exerciseIconContainer}>
        <Ionicons 
          name={exercise.category === 'cardio' ? 'heart' : 
                exercise.category === 'strength' ? 'barbell' : 
                exercise.category === 'flexibility' ? 'body' : 'fitness'} 
          size={24} 
          color="#f97316" 
        />
      </View>
      <View style={styles.exerciseOptionInfo}>
        <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
        <Text style={styles.exerciseOptionDetails}>
          ~{exercise.calories} cal/min • {exercise.category}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Date Selector */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#f97316" />
            <Text style={styles.dateText}>
              {isToday(state.selectedDate) ? 'Today' : state.selectedDate}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{state.exercises.length}</Text>
              <Text style={styles.summaryLabel}>Exercises</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{getTotalCaloriesBurned()}</Text>
              <Text style={styles.summaryLabel}>Calories Burned</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {state.exercises.reduce((total, ex) => total + ex.duration, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Quick Timer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Timer</Text>
          <View style={styles.timerCard}>
            <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
            <View style={styles.timerControls}>
              {!isTimerRunning ? (
                <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
                  <Ionicons name="play" size={24} color="#ffffff" />
                  <Text style={styles.buttonText}>Start</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.stopButton} onPress={handleStopTimer}>
                  <Ionicons name="stop" size={24} color="#ffffff" />
                  <Text style={styles.buttonText}>Stop</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.resetButton} onPress={handleResetTimer}>
                <Ionicons name="refresh" size={24} color="#64748b" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Exercise Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Exercise</Text>
          <View style={styles.exerciseGrid}>
            {exerciseDatabase.map(renderExerciseOption)}
          </View>
        </View>

        {/* Today's Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isToday(state.selectedDate) ? "Today's Exercises" : `Exercises for ${state.selectedDate}`}
          </Text>
          {state.exercises.length === 0 ? (
            <Text style={styles.emptyText}>No exercises logged yet</Text>
          ) : (
            <View style={styles.exercisesList}>
              {state.exercises.map(renderExerciseItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [state.selectedDate]: { selected: true, selectedColor: '#f97316' },
            }}
            theme={{
              backgroundColor: '#1e293b',
              calendarBackground: '#1e293b',
              textSectionTitleColor: '#f8fafc',
              selectedDayBackgroundColor: '#f97316',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#f97316',
              dayTextColor: '#f8fafc',
              textDisabledColor: '#64748b',
              monthTextColor: '#f8fafc',
              arrowColor: '#f97316',
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add {selectedExercise?.name}</Text>
            <TouchableOpacity onPress={() => setShowAddExercise(false)}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
          
          {selectedExercise && (
            <View style={styles.addExerciseContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.durationInput}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="Enter duration"
                  placeholderTextColor="#64748b"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Intensity</Text>
                <View style={styles.intensityButtons}>
                  {['low', 'moderate', 'high'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        intensity === level && styles.selectedIntensity,
                      ]}
                      onPress={() => setIntensity(level)}
                    >
                      <Text
                        style={[
                          styles.intensityText,
                          intensity === level && styles.selectedIntensityText,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {duration && (
                <View style={styles.caloriesPreview}>
                  <Text style={styles.caloriesText}>
                    Estimated calories: {calculateCaloriesBurned()} cal
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
                <Text style={styles.addButtonText}>Log Exercise</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateText: {
    color: '#f8fafc',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
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
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  timerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f97316',
    fontFamily: 'monospace',
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  startButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  buttonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  resetButtonText: {
    color: '#64748b',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseOption: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    marginRight: 12,
  },
  exerciseOptionInfo: {
    flex: 1,
  },
  exerciseOptionName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseOptionDetails: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseDetails: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  exerciseTime: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addExerciseContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  durationInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 16,
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  selectedIntensity: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  intensityText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  selectedIntensityText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  caloriesPreview: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  caloriesText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
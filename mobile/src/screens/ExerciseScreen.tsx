import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SessionManager } from '../utils/session';

const ExerciseScreen = () => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [duration, setDuration] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();
  const sessionId = SessionManager.getSessionId();

  const exerciseTypes = [
    { name: 'Running', icon: 'directions-run', caloriesPerMin: 12 },
    { name: 'Walking', icon: 'directions-walk', caloriesPerMin: 5 },
    { name: 'Cycling', icon: 'directions-bike', caloriesPerMin: 8 },
    { name: 'Swimming', icon: 'pool', caloriesPerMin: 10 },
    { name: 'Strength Training', icon: 'fitness-center', caloriesPerMin: 6 },
    { name: 'Dancing', icon: 'music-note', caloriesPerMin: 7 },
  ];

  // Get today's exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises', sessionId, selectedDate],
    queryFn: async () => {
      // This would call your exercise API endpoint
      // For now, returning empty array as placeholder
      return [];
    },
    staleTime: 1 * 60 * 1000,
  });

  // Add exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      // This would call your add exercise API endpoint
      // For now, just returning the data
      return exerciseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setSelectedExercise('');
      setDuration('');
      setTimerSeconds(0);
      Alert.alert('Success', 'Exercise logged successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to log exercise');
    },
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    const minutes = Math.floor(timerSeconds / 60);
    setDuration(minutes.toString());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateCalories = () => {
    if (!selectedExercise || !duration) return 0;
    const exercise = exerciseTypes.find(ex => ex.name === selectedExercise);
    return exercise ? exercise.caloriesPerMin * parseInt(duration) : 0;
  };

  const logExercise = () => {
    if (!selectedExercise || !duration) {
      Alert.alert('Error', 'Please select an exercise and duration');
      return;
    }

    const exerciseData = {
      sessionId,
      exerciseName: selectedExercise,
      duration: parseInt(duration),
      caloriesBurned: calculateCalories(),
      date: selectedDate,
    };

    addExerciseMutation.mutate(exerciseData);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Tracker</Text>
        <Text style={styles.subtitle}>Track your workout sessions</Text>
      </View>

      {/* Timer */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Workout Timer</Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
            
            <View style={styles.timerButtons}>
              {!isTimerRunning ? (
                <Button
                  mode="contained"
                  onPress={startTimer}
                  style={styles.timerButton}
                  contentStyle={styles.buttonContent}
                >
                  Start Timer
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={stopTimer}
                  style={styles.timerButton}
                  contentStyle={styles.buttonContent}
                >
                  Stop Timer
                </Button>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Exercise Selection */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Quick Exercise Log</Text>
          
          <View style={styles.exerciseGrid}>
            {exerciseTypes.map((exercise) => (
              <TouchableOpacity
                key={exercise.name}
                style={[
                  styles.exerciseCard,
                  selectedExercise === exercise.name && styles.exerciseCardSelected,
                ]}
                onPress={() => setSelectedExercise(exercise.name)}
              >
                <Icon
                  name={exercise.icon}
                  size={32}
                  color={selectedExercise === exercise.name ? '#6366F1' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.exerciseText,
                    selectedExercise === exercise.name && styles.exerciseTextSelected,
                  ]}
                >
                  {exercise.name}
                </Text>
                <Text style={styles.exerciseCalories}>
                  {exercise.caloriesPerMin} cal/min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="Enter duration"
                placeholderTextColor="#94A3B8"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
          </View>

          {selectedExercise && duration && (
            <View style={styles.caloriePreview}>
              <Text style={styles.calorieText}>
                Estimated calories burned: {calculateCalories()} cal
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={logExercise}
            loading={addExerciseMutation.isPending}
            disabled={!selectedExercise || !duration}
            style={styles.logButton}
            contentStyle={styles.buttonContent}
          >
            Log Exercise
          </Button>
        </View>
      </Card>

      {/* Today's Exercises */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Today's Exercises</Text>
          
          {isLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : exercises.length === 0 ? (
            <Text style={styles.emptyText}>No exercises logged today</Text>
          ) : (
            exercises.map((exercise: any, index: number) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.duration} min | {exercise.caloriesBurned} cal burned
                  </Text>
                </View>
                <Icon name="fitness-center" size={24} color="#6366F1" />
              </View>
            ))
          )}
          
          {exercises.length > 0 && (
            <View style={styles.totalCalories}>
              <Text style={styles.totalCaloriesText}>
                Total calories burned: {exercises.reduce((total: number, ex: any) => total + ex.caloriesBurned, 0)} cal
              </Text>
            </View>
          )}
        </View>
      </Card>

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
  timerContainer: {
    alignItems: 'center',
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timerButton: {
    backgroundColor: '#6366F1',
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  exerciseCard: {
    width: '30%',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  exerciseCardSelected: {
    backgroundColor: '#6366F1',
  },
  exerciseText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  exerciseTextSelected: {
    color: '#fff',
  },
  exerciseCalories: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: '#334155',
    color: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  caloriePreview: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  calorieText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: '#6366F1',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    paddingVertical: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#94A3B8',
  },
  totalCalories: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  totalCaloriesText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default ExerciseScreen;
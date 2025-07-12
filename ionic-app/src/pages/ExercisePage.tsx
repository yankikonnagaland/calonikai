import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonSpinner,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { play, pause, stop, refresh, fitness, trash } from 'ionicons/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../services/AuthService';
import apiService from '../services/ApiService';

const ExercisePage: React.FC = () => {
  const { sessionId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseName, setExerciseName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const queryClient = useQueryClient();

  // Fetch exercises for selected date
  const { data: exercises = [], isLoading: exercisesLoading, refetch: refetchExercises } = useQuery({
    queryKey: ['exercises', sessionId, selectedDate],
    queryFn: () => apiService.getExercises(sessionId, selectedDate),
  });

  // Add exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: (exerciseData: any) => apiService.addExercise(exerciseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', sessionId, selectedDate] });
      resetForm();
      showToastMessage('Exercise added successfully!');
    },
    onError: () => {
      showToastMessage('Failed to add exercise');
    },
  });

  // Remove exercise mutation
  const removeExerciseMutation = useMutation({
    mutationFn: (id: number) => apiService.removeExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises', sessionId, selectedDate] });
      showToastMessage('Exercise removed');
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime]);

  // Calculate calories when duration or exercise changes
  useEffect(() => {
    if (duration && exerciseName) {
      const minutes = parseInt(duration);
      if (minutes > 0) {
        const calories = calculateCalories(exerciseName, minutes, intensity);
        setEstimatedCalories(calories);
      }
    }
  }, [duration, exerciseName, intensity]);

  const calculateCalories = (activity: string, minutes: number, intensityLevel: string): number => {
    const baseCaloriesPerMinute: { [key: string]: number } = {
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

    const intensityMultipliers: { [key: string]: number } = {
      'low': 0.7,
      'moderate': 1.0,
      'high': 1.3,
    };

    const activityKey = Object.keys(baseCaloriesPerMinute).find(key => 
      activity.toLowerCase().includes(key)
    ) || 'gym workout';

    const baseCalories = baseCaloriesPerMinute[activityKey] || 6;
    const multiplier = intensityMultipliers[intensityLevel] || 1.0;
    
    return Math.round(baseCalories * minutes * multiplier);
  };

  const startTimer = () => {
    setStartTime(Date.now());
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (startTime) {
      const finalDuration = Math.round(elapsedTime / 1000 / 60);
      setDuration(finalDuration.toString());
    }
    setIsTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setDuration('');
    setEstimatedCalories(0);
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addExercise = () => {
    if (!exerciseName.trim() || !duration) {
      showToastMessage('Please fill in exercise name and duration');
      return;
    }

    const exerciseData = {
      sessionId,
      date: selectedDate,
      exerciseName,
      duration: parseInt(duration),
      intensity,
      caloriesBurned: estimatedCalories,
    };

    addExerciseMutation.mutate(exerciseData);
  };

  const resetForm = () => {
    setExerciseName('');
    setDuration('');
    setIntensity('moderate');
    setEstimatedCalories(0);
    resetTimer();
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await refetchExercises();
    event.detail.complete();
  };

  const totalCaloriesBurned = exercises.reduce((total, exercise) => 
    total + (exercise.caloriesBurned || 0), 0
  );

  const totalMinutes = exercises.reduce((total, exercise) => 
    total + (exercise.duration || 0), 0
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Exercise Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Date Selector */}
        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Date</IonLabel>
              <IonInput
                type="date"
                value={selectedDate}
                onIonInput={(e) => setSelectedDate(e.detail.value!)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Exercise Timer */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Exercise Timer</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ 
              textAlign: 'center', 
              fontSize: '2rem', 
              fontWeight: 'bold',
              padding: '20px',
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              border: '2px solid #10b981',
              marginBottom: '20px'
            }}>
              {isTimerRunning ? formatTime(elapsedTime) : '00:00'}
            </div>
            
            <IonGrid>
              <IonRow>
                <IonCol size="4">
                  <IonButton 
                    expand="block" 
                    color={isTimerRunning ? 'medium' : 'success'}
                    onClick={startTimer}
                    disabled={isTimerRunning}
                  >
                    <IonIcon icon={play} />
                  </IonButton>
                </IonCol>
                <IonCol size="4">
                  <IonButton 
                    expand="block" 
                    color="danger"
                    onClick={stopTimer}
                    disabled={!isTimerRunning}
                  >
                    <IonIcon icon={stop} />
                  </IonButton>
                </IonCol>
                <IonCol size="4">
                  <IonButton 
                    expand="block" 
                    color="medium"
                    onClick={resetTimer}
                  >
                    <IonIcon icon={refresh} />
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Exercise Form */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Log Exercise</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Exercise Name</IonLabel>
              <IonInput
                value={exerciseName}
                onIonInput={(e) => setExerciseName(e.detail.value!)}
                placeholder="e.g., Running, Gym workout, Yoga"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Duration (minutes)</IonLabel>
              <IonInput
                type="number"
                value={duration}
                onIonInput={(e) => setDuration(e.detail.value!)}
                placeholder="Enter duration in minutes"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Intensity Level</IonLabel>
              <IonSelect value={intensity} onIonChange={(e) => setIntensity(e.detail.value)}>
                <IonSelectOption value="low">Low 😌</IonSelectOption>
                <IonSelectOption value="moderate">Moderate 💪</IonSelectOption>
                <IonSelectOption value="high">High 🔥</IonSelectOption>
              </IonSelect>
            </IonItem>

            {estimatedCalories > 0 && (
              <div className="metric-card" style={{ margin: '16px 0' }}>
                <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                  <strong>Estimated calories burned: {estimatedCalories} cal</strong>
                </p>
              </div>
            )}

            <IonButton 
              expand="block" 
              onClick={addExercise}
              disabled={addExerciseMutation.isPending || !exerciseName.trim() || !duration}
              style={{ marginTop: '20px' }}
            >
              {addExerciseMutation.isPending ? <IonSpinner /> : <IonIcon icon={fitness} />}
              {addExerciseMutation.isPending ? 'Adding...' : 'Add Exercise'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Today's Summary */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {selectedDate === new Date().toISOString().split('T')[0] ? 
                "Today's Activity" : 
                `${new Date(selectedDate).toLocaleDateString()} Activity`}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="4" style={{ textAlign: 'center' }}>
                  <div className="metric-value">{exercises.length}</div>
                  <div className="metric-label">Exercises</div>
                </IonCol>
                <IonCol size="4" style={{ textAlign: 'center' }}>
                  <div className="metric-value">{totalMinutes}</div>
                  <div className="metric-label">Minutes</div>
                </IonCol>
                <IonCol size="4" style={{ textAlign: 'center' }}>
                  <div className="metric-value">{totalCaloriesBurned}</div>
                  <div className="metric-label">Calories Burned</div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Exercise History */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Exercise History</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {exercisesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <IonSpinner />
              </div>
            ) : exercises.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                No exercises logged for this date
              </p>
            ) : (
              <IonList>
                {exercises.map((exercise, index) => (
                  <IonItem key={index}>
                    <IonIcon icon={fitness} slot="start" color="primary" />
                    <IonLabel>
                      <h3>{exercise.exerciseName || exercise.name}</h3>
                      <p>{exercise.duration} min • {exercise.intensity} intensity • {exercise.caloriesBurned} cal</p>
                    </IonLabel>
                    <IonButton 
                      fill="clear" 
                      color="danger"
                      onClick={() => removeExerciseMutation.mutate(exercise.id)}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ExercisePage;
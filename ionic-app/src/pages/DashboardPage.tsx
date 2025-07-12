import React, { useState } from 'react';
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
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { flame, fitness, trending, scale, calendar } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../services/AuthService';
import apiService from '../services/ApiService';

const DashboardPage: React.FC = () => {
  const { sessionId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch daily summary
  const { data: dailySummary, refetch: refetchSummary } = useQuery({
    queryKey: ['dailySummary', sessionId, selectedDate],
    queryFn: () => apiService.getDailySummary(sessionId, selectedDate),
  });

  // Fetch exercises
  const { data: exercises = [], refetch: refetchExercises } = useQuery({
    queryKey: ['exercises', sessionId, selectedDate],
    queryFn: () => apiService.getExercises(sessionId, selectedDate),
  });

  // Fetch profile
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', sessionId],
    queryFn: () => apiService.getUserProfile(sessionId),
  });

  // Fetch daily weight
  const { data: dailyWeight, refetch: refetchWeight } = useQuery({
    queryKey: ['dailyWeight', sessionId, selectedDate],
    queryFn: () => apiService.getDailyWeight(sessionId, selectedDate),
  });

  const handleRefresh = async (event: CustomEvent) => {
    await Promise.all([
      refetchSummary(),
      refetchExercises(),
      refetchProfile(),
      refetchWeight(),
    ]);
    event.detail.complete();
  };

  // Calculate metrics
  const caloriesIn = dailySummary?.totalCalories || 0;
  const caloriesBurned = exercises.reduce((total, exercise) => 
    total + (exercise.caloriesBurned || 0), 0
  );
  const netCalories = caloriesIn - caloriesBurned;
  const currentWeight = dailyWeight?.weight || profile?.weight || 0;
  
  const proteinConsumed = dailySummary?.totalProtein || 0;
  const proteinTarget = profile?.dailyProteinTarget || profile?.proteinTarget || 60;
  const proteinProgress = proteinTarget > 0 ? (proteinConsumed / proteinTarget) * 100 : 0;

  const calorieTarget = profile?.targetCalories || 2000;
  const calorieProgress = calorieTarget > 0 ? (caloriesIn / calorieTarget) * 100 : 0;

  // Get last 7 days data for trends
  const getLast7Days = (): string[] => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Health Dashboard</IonTitle>
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
              <IonIcon icon={calendar} slot="start" color="primary" />
              <IonLabel position="stacked">
                {isToday ? "Today's Data" : "Selected Date"}
              </IonLabel>
              <IonInput
                type="date"
                value={selectedDate}
                onIonInput={(e) => setSelectedDate(e.detail.value!)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Daily Metrics Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                  <IonIcon 
                    icon={flame} 
                    size="large" 
                    color="danger" 
                    style={{ marginBottom: '8px' }}
                  />
                  <div className="metric-value">{caloriesIn}</div>
                  <div className="metric-label">Calories In</div>
                  {calorieTarget > 0 && (
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#374151', 
                      borderRadius: '2px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(calorieProgress, 100)}%`,
                        height: '100%',
                        backgroundColor: calorieProgress > 100 ? '#ef4444' : '#10b981',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                  {calorieTarget > 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '4px 0 0 0' }}>
                      {Math.round(calorieProgress)}% of {calorieTarget} goal
                    </p>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
            
            <IonCol size="6">
              <IonCard>
                <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                  <IonIcon 
                    icon={fitness} 
                    size="large" 
                    color="warning" 
                    style={{ marginBottom: '8px' }}
                  />
                  <div className="metric-value">{caloriesBurned}</div>
                  <div className="metric-label">Calories Out</div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '12px 0 0 0' }}>
                    {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                  </p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                  <IonIcon 
                    icon={trending} 
                    size="large" 
                    color={netCalories > 0 ? 'success' : 'primary'} 
                    style={{ marginBottom: '8px' }}
                  />
                  <div className="metric-value" style={{ 
                    color: netCalories > 0 ? '#10b981' : '#3b82f6' 
                  }}>
                    {netCalories > 0 ? '+' : ''}{netCalories}
                  </div>
                  <div className="metric-label">Net Calories</div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '12px 0 0 0' }}>
                    {netCalories > 0 ? 'Surplus' : netCalories < 0 ? 'Deficit' : 'Balanced'}
                  </p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            
            <IonCol size="6">
              <IonCard>
                <IonCardContent style={{ textAlign: 'center', padding: '16px' }}>
                  <IonIcon 
                    icon={scale} 
                    size="large" 
                    color="tertiary" 
                    style={{ marginBottom: '8px' }}
                  />
                  <div className="metric-value">{currentWeight}</div>
                  <div className="metric-label">Weight (kg)</div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '12px 0 0 0' }}>
                    {isToday ? 'Today' : new Date(selectedDate).toLocaleDateString()}
                  </p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Protein Progress (if muscle building goal) */}
        {profile?.goal === 'muscle' && proteinTarget > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Protein Progress</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {proteinConsumed.toFixed(1)}g / {proteinTarget}g
                </span>
                <span style={{ 
                  color: proteinProgress >= 100 ? '#10b981' : '#f97316',
                  fontWeight: 'bold'
                }}>
                  {Math.round(proteinProgress)}%
                </span>
              </div>
              
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#374151', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(proteinProgress, 100)}%`,
                  height: '100%',
                  backgroundColor: proteinProgress >= 100 ? '#10b981' : '#f97316',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              {proteinProgress < 100 && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#9ca3af', 
                  margin: '8px 0 0 0',
                  textAlign: 'center'
                }}>
                  {(proteinTarget - proteinConsumed).toFixed(1)}g more protein needed
                </p>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Nutrition Breakdown */}
        {dailySummary && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Nutrition Breakdown</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="4" style={{ textAlign: 'center' }}>
                    <div className="metric-value" style={{ color: '#f97316' }}>
                      {(dailySummary.totalProtein || 0).toFixed(1)}g
                    </div>
                    <div className="metric-label">Protein</div>
                  </IonCol>
                  <IonCol size="4" style={{ textAlign: 'center' }}>
                    <div className="metric-value" style={{ color: '#3b82f6' }}>
                      {(dailySummary.totalCarbs || 0).toFixed(1)}g
                    </div>
                    <div className="metric-label">Carbs</div>
                  </IonCol>
                  <IonCol size="4" style={{ textAlign: 'center' }}>
                    <div className="metric-value" style={{ color: '#10b981' }}>
                      {(dailySummary.totalFat || 0).toFixed(1)}g
                    </div>
                    <div className="metric-label">Fat</div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        {/* Goal Progress */}
        {profile && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Goal Progress</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#1f2937', 
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {profile.goal === 'lose' && '🔥 Weight Loss Goal'}
                  {profile.goal === 'gain' && '📈 Weight Gain Goal'}
                  {profile.goal === 'maintain' && '⚖️ Weight Maintenance'}
                  {profile.goal === 'muscle' && '⚡ Muscle Building Goal'}
                </h4>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#d1d5db' }}>
                  Target: {Math.round(profile.targetCalories || 0)} cal/day
                  {profile.goal === 'muscle' && ` • ${Math.round(proteinTarget)}g protein/day`}
                </p>
                {profile.weightTarget && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#d1d5db' }}>
                    Target Weight: {profile.weightTarget}kg
                    {currentWeight > 0 && (
                      <span style={{ marginLeft: '8px', color: '#10b981' }}>
                        ({profile.goal === 'lose' ? 
                          `${(currentWeight - profile.weightTarget).toFixed(1)}kg to lose` :
                          `${(profile.weightTarget - currentWeight).toFixed(1)}kg to gain`
                        })
                      </span>
                    )}
                  </p>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Quick Stats */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {isToday ? "Today's Summary" : `${new Date(selectedDate).toLocaleDateString()} Summary`}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Meals Logged</h3>
                      <p>{dailySummary ? '1 meal' : '0 meals'}</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Exercises</h3>
                      <p>{exercises.length} session{exercises.length !== 1 ? 's' : ''}</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Active Minutes</h3>
                      <p>{exercises.reduce((total, ex) => total + (ex.duration || 0), 0)} min</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Net Balance</h3>
                      <p style={{ 
                        color: netCalories > 0 ? '#10b981' : netCalories < 0 ? '#ef4444' : '#6b7280' 
                      }}>
                        {netCalories > 0 ? '+' : ''}{netCalories} cal
                      </p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
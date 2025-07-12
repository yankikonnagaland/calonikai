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
import { person, save, calculator } from 'ionicons/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../services/AuthService';
import apiService from '../services/ApiService';

interface ProfileData {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain' | 'muscle';
  proteinTarget?: number;
  weightTarget?: number;
}

interface CalculatedResults {
  bmr: number;
  tdee: number;
  targetCalories: number;
  dailyProteinTarget?: number;
}

const ProfilePage: React.FC = () => {
  const { sessionId } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    age: 25,
    gender: 'male',
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintain',
  });
  const [results, setResults] = useState<CalculatedResults | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', sessionId],
    queryFn: () => apiService.getUserProfile(sessionId),
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiService.saveUserProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', sessionId] });
      setResults({
        bmr: data.bmr,
        tdee: data.tdee,
        targetCalories: data.targetCalories,
        dailyProteinTarget: data.dailyProteinTarget,
      });
      showToastMessage('Profile saved successfully!');
    },
    onError: () => {
      showToastMessage('Failed to save profile');
    },
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age || 25,
        gender: profile.gender || 'male',
        height: profile.height || 170,
        weight: profile.weight || 70,
        activityLevel: profile.activityLevel || 'moderate',
        goal: profile.goal || 'maintain',
        proteinTarget: profile.proteinTarget,
        weightTarget: profile.weightTarget,
      });

      if (profile.bmr && profile.tdee && profile.targetCalories) {
        setResults({
          bmr: profile.bmr,
          tdee: profile.tdee,
          targetCalories: profile.targetCalories,
          dailyProteinTarget: profile.dailyProteinTarget,
        });
      }
    }
  }, [profile]);

  const calculateProfile = () => {
    const profileDataToSave = {
      ...formData,
      sessionId,
    };

    saveProfileMutation.mutate(profileDataToSave);
  };

  const updateFormData = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await refetchProfile();
    event.detail.complete();
  };

  const getBMRExplanation = () => {
    return "Basal Metabolic Rate (BMR) is the number of calories your body needs to maintain basic physiological functions like breathing, circulation, and cell production while at rest.";
  };

  const getTDEEExplanation = () => {
    return "Total Daily Energy Expenditure (TDEE) is your BMR plus calories burned through daily activities and exercise. This represents your total calorie needs.";
  };

  const getTargetCaloriesExplanation = () => {
    return "Daily Target Calories is your personalized calorie goal based on your TDEE and weight management goal (lose, maintain, or gain weight).";
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Profile Form */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Personal Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Age</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.age}
                      onIonInput={(e) => updateFormData('age', parseInt(e.detail.value!) || 25)}
                      placeholder="Enter your age"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Gender</IonLabel>
                    <IonSelect 
                      value={formData.gender} 
                      onIonChange={(e) => updateFormData('gender', e.detail.value)}
                    >
                      <IonSelectOption value="male">Male</IonSelectOption>
                      <IonSelectOption value="female">Female</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
              
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Height (cm)</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.height}
                      onIonInput={(e) => updateFormData('height', parseFloat(e.detail.value!) || 170)}
                      placeholder="Enter height in cm"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Weight (kg)</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.weight}
                      onIonInput={(e) => updateFormData('weight', parseFloat(e.detail.value!) || 70)}
                      placeholder="Enter weight in kg"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonItem>
              <IonLabel position="stacked">Activity Level</IonLabel>
              <IonSelect 
                value={formData.activityLevel} 
                onIonChange={(e) => updateFormData('activityLevel', e.detail.value)}
              >
                <IonSelectOption value="sedentary">Sedentary (Little/no exercise)</IonSelectOption>
                <IonSelectOption value="light">Light (Light exercise 1-3 days/week)</IonSelectOption>
                <IonSelectOption value="moderate">Moderate (Moderate exercise 3-5 days/week)</IonSelectOption>
                <IonSelectOption value="active">Active (Hard exercise 6-7 days/week)</IonSelectOption>
                <IonSelectOption value="very_active">Very Active (Very hard exercise, physical job)</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Goal</IonLabel>
              <IonSelect 
                value={formData.goal} 
                onIonChange={(e) => updateFormData('goal', e.detail.value)}
              >
                <IonSelectOption value="lose">🔥 Lose Weight</IonSelectOption>
                <IonSelectOption value="maintain">⚖️ Maintain Weight</IonSelectOption>
                <IonSelectOption value="gain">📈 Gain Weight</IonSelectOption>
                <IonSelectOption value="muscle">⚡ Build Muscle</IonSelectOption>
              </IonSelect>
            </IonItem>

            {formData.goal === 'muscle' && (
              <IonItem>
                <IonLabel position="stacked">Protein Target (g/day) - Optional</IonLabel>
                <IonInput
                  type="number"
                  value={formData.proteinTarget}
                  onIonInput={(e) => updateFormData('proteinTarget', parseFloat(e.detail.value!) || undefined)}
                  placeholder="Auto-calculated if left empty"
                />
              </IonItem>
            )}

            {(formData.goal === 'lose' || formData.goal === 'gain') && (
              <IonItem>
                <IonLabel position="stacked">Target Weight (kg) - Optional</IonLabel>
                <IonInput
                  type="number"
                  value={formData.weightTarget}
                  onIonInput={(e) => updateFormData('weightTarget', parseFloat(e.detail.value!) || undefined)}
                  placeholder="Enter your target weight"
                />
              </IonItem>
            )}

            <IonButton 
              expand="block" 
              onClick={calculateProfile}
              disabled={saveProfileMutation.isPending}
              style={{ marginTop: '20px' }}
            >
              {saveProfileMutation.isPending ? <IonSpinner /> : <IonIcon icon={calculator} />}
              {saveProfileMutation.isPending ? 'Calculating...' : 'Calculate My Profile'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Results */}
        {results && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Your Targets</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="4" style={{ textAlign: 'center' }}>
                    <div className="metric-value">{Math.round(results.bmr)}</div>
                    <div className="metric-label">BMR</div>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                      {getBMRExplanation()}
                    </p>
                  </IonCol>
                  <IonCol size="4" style={{ textAlign: 'center' }}>
                    <div className="metric-value">{Math.round(results.tdee)}</div>
                    <div className="metric-label">TDEE</div>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                      {getTDEEExplanation()}
                    </p>
                  </IonCol>
                  <IonCol size="4" style={{ textAlign: 'center' }}>
                    <div className="metric-value">{Math.round(results.targetCalories)}</div>
                    <div className="metric-label">Daily Target</div>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                      {getTargetCaloriesExplanation()}
                    </p>
                  </IonCol>
                </IonRow>
                
                {results.dailyProteinTarget && (
                  <IonRow>
                    <IonCol size="12" style={{ textAlign: 'center', marginTop: '20px' }}>
                      <div className="metric-card">
                        <div className="metric-value">{Math.round(results.dailyProteinTarget)}g</div>
                        <div className="metric-label">Daily Protein Target</div>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                          Recommended protein intake for muscle building goals
                        </p>
                      </div>
                    </IonCol>
                  </IonRow>
                )}
              </IonGrid>

              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                backgroundColor: '#1f2937', 
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Personalized Recommendations</h4>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#d1d5db' }}>
                  {formData.goal === 'lose' && 'Focus on creating a calorie deficit through balanced nutrition and regular exercise.'}
                  {formData.goal === 'gain' && 'Aim for a moderate calorie surplus with strength training to build lean mass.'}
                  {formData.goal === 'maintain' && 'Balance your calorie intake with your daily energy expenditure.'}
                  {formData.goal === 'muscle' && 'Combine adequate protein intake with resistance training for optimal muscle building.'}
                </p>
              </div>
            </IonCardContent>
          </IonCard>
        )}

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

export default ProfilePage;
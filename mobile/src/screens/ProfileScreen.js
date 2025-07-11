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

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    goal: 'lose',
    targetWeight: '',
    proteinTarget: ''
  });
  const [calculations, setCalculations] = useState(null);

  const API_BASE = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api';

  useEffect(() => {
    loadProfile();
  }, []);

  const getSessionId = async () => {
    let sessionId = await AsyncStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const loadProfile = async () => {
    try {
      const sessionId = await getSessionId();
      const response = await fetch(`${API_BASE}/profile/${sessionId}`);
      
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          age: profileData.age?.toString() || '',
          gender: profileData.gender || 'male',
          height: profileData.height?.toString() || '',
          weight: profileData.weight?.toString() || '',
          activityLevel: profileData.activityLevel || 'moderate',
          goal: profileData.goal || 'lose',
          targetWeight: profileData.targetWeight?.toString() || '',
          proteinTarget: profileData.proteinTarget?.toString() || ''
        });
        
        if (profileData.bmr && profileData.tdee) {
          setCalculations({
            bmr: profileData.bmr,
            tdee: profileData.tdee,
            targetCalories: profileData.targetCalories,
            dailyProteinTarget: profileData.dailyProteinTarget
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateProfile = async () => {
    const { age, gender, height, weight, activityLevel, goal, targetWeight, proteinTarget } = formData;
    
    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill in age, height, and weight');
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = await getSessionId();
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          sessionId,
          age: parseInt(age),
          gender,
          height: parseFloat(height),
          weight: parseFloat(weight),
          activityLevel,
          goal,
          targetWeight: targetWeight ? parseFloat(targetWeight) : null,
          proteinTarget: proteinTarget ? parseFloat(proteinTarget) : null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCalculations({
          bmr: result.bmr,
          tdee: result.tdee,
          targetCalories: result.targetCalories,
          dailyProteinTarget: result.dailyProteinTarget
        });
        setProfile(result);
        Alert.alert('Success', 'Profile calculated and saved!');
      } else {
        Alert.alert('Error', 'Failed to calculate profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate profile');
      console.error('Profile calculation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getGoalDescription = (goal) => {
    switch (goal) {
      case 'lose': return 'Lose Weight';
      case 'gain': return 'Gain Weight';
      case 'muscle': return 'Build Muscle';
      default: return 'Maintain Weight';
    }
  };

  const getActivityDescription = (level) => {
    switch (level) {
      case 'sedentary': return 'Sedentary (Little/no exercise)';
      case 'light': return 'Light (Light exercise 1-3 days/week)';
      case 'moderate': return 'Moderate (Moderate exercise 3-5 days/week)';
      case 'active': return 'Active (Hard exercise 6-7 days/week)';
      case 'extra': return 'Very Active (Very hard exercise/physical job)';
      default: return 'Moderate';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>Set up your nutrition goals</Text>
        </View>

        {/* Current Results */}
        {calculations && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Your Targets</Text>
            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultNumber}>{Math.round(calculations.bmr)}</Text>
                <Text style={styles.resultLabel}>BMR</Text>
                <Text style={styles.resultSubtext}>Base metabolic rate</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultNumber}>{Math.round(calculations.tdee)}</Text>
                <Text style={styles.resultLabel}>TDEE</Text>
                <Text style={styles.resultSubtext}>Daily energy expenditure</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultNumber}>{Math.round(calculations.targetCalories)}</Text>
                <Text style={styles.resultLabel}>Target Calories</Text>
                <Text style={styles.resultSubtext}>Daily calorie goal</Text>
              </View>
              {calculations.dailyProteinTarget && (
                <View style={styles.resultItem}>
                  <Text style={styles.resultNumber}>{Math.round(calculations.dailyProteinTarget)}g</Text>
                  <Text style={styles.resultLabel}>Protein</Text>
                  <Text style={styles.resultSubtext}>Daily protein target</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Profile Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Basic Info */}
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter age"
                placeholderTextColor="#94A3B8"
                value={formData.age}
                onChangeText={(value) => updateFormData('age', value)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, formData.gender === 'male' && styles.toggleButtonActive]}
                  onPress={() => updateFormData('gender', 'male')}
                >
                  <Text style={[styles.toggleText, formData.gender === 'male' && styles.toggleTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, formData.gender === 'female' && styles.toggleButtonActive]}
                  onPress={() => updateFormData('gender', 'female')}
                >
                  <Text style={[styles.toggleText, formData.gender === 'female' && styles.toggleTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter height"
                placeholderTextColor="#94A3B8"
                value={formData.height}
                onChangeText={(value) => updateFormData('height', value)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter weight"
                placeholderTextColor="#94A3B8"
                value={formData.weight}
                onChangeText={(value) => updateFormData('weight', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Goal Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Goal</Text>
            <View style={styles.goalGrid}>
              {[
                { value: 'lose', icon: '📉', label: 'Lose Weight' },
                { value: 'gain', icon: '📈', label: 'Gain Weight' },
                { value: 'muscle', icon: '💪', label: 'Build Muscle' }
              ].map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[styles.goalButton, formData.goal === goal.value && styles.goalButtonActive]}
                  onPress={() => updateFormData('goal', goal.value)}
                >
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <Text style={[styles.goalText, formData.goal === goal.value && styles.goalTextActive]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Weight */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Weight (kg) - Optional</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter target weight"
              placeholderTextColor="#94A3B8"
              value={formData.targetWeight}
              onChangeText={(value) => updateFormData('targetWeight', value)}
              keyboardType="numeric"
            />
          </View>

          {/* Activity Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
              {[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'light', label: 'Light' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'active', label: 'Active' },
                { value: 'extra', label: 'Very Active' }
              ].map((activity) => (
                <TouchableOpacity
                  key={activity.value}
                  style={[styles.activityButton, formData.activityLevel === activity.value && styles.activityButtonActive]}
                  onPress={() => updateFormData('activityLevel', activity.value)}
                >
                  <Text style={[styles.activityText, formData.activityLevel === activity.value && styles.activityTextActive]}>
                    {activity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Protein Target */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Custom Protein Target (g/day) - Optional</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Auto-calculated if empty"
              placeholderTextColor="#94A3B8"
              value={formData.proteinTarget}
              onChangeText={(value) => updateFormData('proteinTarget', value)}
              keyboardType="numeric"
            />
          </View>

          {/* Calculate Button */}
          <TouchableOpacity
            style={[styles.calculateButton, isLoading && styles.calculateButtonDisabled]}
            onPress={calculateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.calculateButtonText}>Calculate My Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.actionButtonText}>📊 View Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionButtonText}>← Back to Home</Text>
          </TouchableOpacity>
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
  resultsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultItem: {
    width: '48%',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  resultNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  resultSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  toggleText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  goalGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  goalButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  goalButtonActive: {
    backgroundColor: '#3B82F6',
  },
  goalIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  goalText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalTextActive: {
    color: '#FFFFFF',
  },
  activityScroll: {
    marginVertical: 4,
  },
  activityButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  activityButtonActive: {
    backgroundColor: '#3B82F6',
  },
  activityText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTextActive: {
    color: '#FFFFFF',
  },
  calculateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonDisabled: {
    backgroundColor: '#64748B',
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
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
import { apiService, UserProfile } from '../services/api';
import { SessionManager } from '../utils/session';

const ProfileScreen = () => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [weightGoal, setWeightGoal] = useState('lose');

  const queryClient = useQueryClient();
  const sessionId = SessionManager.getSessionId();

  // Get user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', sessionId],
    queryFn: () => apiService.getUserProfile(sessionId),
    staleTime: 5 * 60 * 1000,
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: apiService.saveUserProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['user-profile', sessionId], data);
      Alert.alert('Success', 'Profile saved successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save profile');
    },
  });

  // Populate form with existing data
  React.useEffect(() => {
    if (userProfile) {
      setAge(userProfile.age.toString());
      setGender(userProfile.gender);
      setHeight(userProfile.height.toString());
      setWeight(userProfile.weight.toString());
      setActivityLevel(userProfile.activityLevel);
      setWeightGoal(userProfile.weightGoal);
    }
  }, [userProfile]);

  const calculateProfile = () => {
    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const profileData = {
      sessionId,
      age: parseInt(age),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      activityLevel,
      weightGoal,
    };

    saveProfileMutation.mutate(profileData);
  };

  const calculateBMR = () => {
    if (!age || !height || !weight) return 0;
    
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (gender === 'male') {
      return 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      return 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
    }
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.55);
  };

  const calculateTargetCalories = () => {
    const tdee = calculateTDEE();
    if (weightGoal === 'lose') {
      return tdee - 500; // 500 calorie deficit
    } else if (weightGoal === 'gain') {
      return tdee + 300; // 300 calorie surplus
    }
    return tdee; // maintain weight
  };

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const activityOptions = [
    { label: 'Sedentary', value: 'sedentary', desc: 'Little to no exercise' },
    { label: 'Light', value: 'light', desc: 'Light exercise 1-3 days/week' },
    { label: 'Moderate', value: 'moderate', desc: 'Moderate exercise 3-5 days/week' },
    { label: 'Active', value: 'active', desc: 'Heavy exercise 6-7 days/week' },
    { label: 'Very Active', value: 'veryActive', desc: 'Very heavy exercise' },
  ];

  const goalOptions = [
    { label: 'Lose Weight', value: 'lose', icon: 'trending-down' },
    { label: 'Maintain Weight', value: 'maintain', icon: 'trending-flat' },
    { label: 'Gain Weight', value: 'gain', icon: 'trending-up' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Set up your nutrition goals</Text>
      </View>

      {/* Basic Information */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="Enter your age"
              placeholderTextColor="#94A3B8"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.optionGroup}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    gender === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => setGender(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="Enter height in cm"
              placeholderTextColor="#94A3B8"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="Enter weight in kg"
              placeholderTextColor="#94A3B8"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
        </View>
      </Card>

      {/* Activity Level */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Activity Level</Text>
          
          {activityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.activityOption,
                activityLevel === option.value && styles.activityOptionSelected,
              ]}
              onPress={() => setActivityLevel(option.value)}
            >
              <View style={styles.activityOptionContent}>
                <Text
                  style={[
                    styles.activityOptionTitle,
                    activityLevel === option.value && styles.activityOptionTitleSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.activityOptionDesc,
                    activityLevel === option.value && styles.activityOptionDescSelected,
                  ]}
                >
                  {option.desc}
                </Text>
              </View>
              {activityLevel === option.value && (
                <Icon name="check-circle" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Weight Goal */}
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Weight Goal</Text>
          
          <View style={styles.goalGrid}>
            {goalOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.goalCard,
                  weightGoal === option.value && styles.goalCardSelected,
                ]}
                onPress={() => setWeightGoal(option.value)}
              >
                <Icon
                  name={option.icon}
                  size={32}
                  color={weightGoal === option.value ? '#6366F1' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.goalText,
                    weightGoal === option.value && styles.goalTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* Results */}
      {age && height && weight && (
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Your Targets</Text>
            
            <View style={styles.resultGrid}>
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{Math.round(calculateBMR())}</Text>
                <Text style={styles.resultLabel}>BMR</Text>
                <Text style={styles.resultUnit}>cal/day</Text>
              </View>
              
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{Math.round(calculateTDEE())}</Text>
                <Text style={styles.resultLabel}>TDEE</Text>
                <Text style={styles.resultUnit}>cal/day</Text>
              </View>
              
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{Math.round(calculateTargetCalories())}</Text>
                <Text style={styles.resultLabel}>Target</Text>
                <Text style={styles.resultUnit}>cal/day</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={calculateProfile}
        loading={saveProfileMutation.isPending}
        style={styles.saveButton}
        contentStyle={styles.saveButtonContent}
      >
        Save Profile
      </Button>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
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
  inputGroup: {
    marginBottom: 16,
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
  optionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#6366F1',
  },
  optionText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  activityOption: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityOptionSelected: {
    backgroundColor: '#6366F1',
  },
  activityOptionContent: {
    flex: 1,
  },
  activityOptionTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityOptionTitleSelected: {
    color: '#fff',
  },
  activityOptionDesc: {
    color: '#94A3B8',
    fontSize: 14,
  },
  activityOptionDescSelected: {
    color: '#E2E8F0',
  },
  goalGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  goalCard: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  goalCardSelected: {
    backgroundColor: '#6366F1',
  },
  goalText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  goalTextSelected: {
    color: '#fff',
  },
  resultGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  resultCard: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultValue: {
    color: '#6366F1',
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultLabel: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  resultUnit: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    marginTop: 16,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default ProfileScreen;
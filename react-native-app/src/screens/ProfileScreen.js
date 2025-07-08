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
import { calculateBMR, calculateTDEE, calculateTargetCalories } from '../utils/calculations';

export default function ProfileScreen() {
  const { userProfile, dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    goal: 'maintain',
    proteinTarget: '',
    weightTarget: '',
  });
  const [results, setResults] = useState(null);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        age: userProfile.age?.toString() || '',
        gender: userProfile.gender || 'male',
        height: userProfile.height?.toString() || '',
        weight: userProfile.weight?.toString() || '',
        activityLevel: userProfile.activityLevel || 'sedentary',
        goal: userProfile.goal || 'maintain',
        proteinTarget: userProfile.proteinTarget?.toString() || '',
        weightTarget: userProfile.weightTarget?.toString() || '',
      });
      
      if (userProfile.age && userProfile.height && userProfile.weight) {
        calculateProfile();
      }
    }
    
    // Set motivational quote
    const quotes = [
      "Your body is your temple. Keep it pure and clean for the soul to reside in.",
      "Take care of your body. It's the only place you have to live.",
      "A healthy outside starts from the inside.",
      "The groundwork for all happiness is good health.",
      "Every step you take is a step towards a healthier you.",
    ];
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [userProfile]);

  const calculateProfile = () => {
    if (!formData.age || !formData.height || !formData.weight) {
      Alert.alert('Error', 'Please fill in age, height, and weight');
      return;
    }

    const age = parseInt(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    const weightTarget = parseFloat(formData.weightTarget) || weight;
    const proteinTarget = parseFloat(formData.proteinTarget) || (weight * 0.8);

    const bmr = calculateBMR(weight, height, age, formData.gender);
    const tdee = calculateTDEE(bmr, formData.activityLevel);
    const targetCalories = calculateTargetCalories(tdee, formData.goal);

    const profileData = {
      ...formData,
      age,
      height,
      weight,
      weightTarget,
      proteinTarget,
      bmr,
      tdee,
      targetCalories,
    };

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      proteinTarget: Math.round(proteinTarget),
    });

    dispatch({ type: 'SET_USER_PROFILE', payload: profileData });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (office job)' },
    { value: 'lightly_active', label: 'Lightly active (1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately active (3-5 days/week)' },
    { value: 'very_active', label: 'Very active (6-7 days/week)' },
    { value: 'extremely_active', label: 'Extremely active (2x/day)' },
  ];

  const goals = [
    { value: 'lose', label: 'Lose Weight', icon: 'trending-down' },
    { value: 'maintain', label: 'Maintain Weight', icon: 'remove' },
    { value: 'gain', label: 'Gain Weight', icon: 'trending-up' },
    { value: 'muscle', label: 'Build Muscle', icon: 'fitness' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Profile & Goals</Text>
        
        {/* Motivational Quote */}
        <View style={styles.quoteContainer}>
          <Ionicons name="heart" size={20} color="#f97316" />
          <Text style={styles.quote}>{motivationalQuote}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Enter your name"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(value) => updateField('age', value)}
                placeholder="25"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'male' && styles.genderButtonActive
                  ]}
                  onPress={() => updateField('gender', 'male')}
                >
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === 'male' && styles.genderButtonTextActive
                  ]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'female' && styles.genderButtonActive
                  ]}
                  onPress={() => updateField('gender', 'female')}
                >
                  <Text style={[
                    styles.genderButtonText,
                    formData.gender === 'female' && styles.genderButtonTextActive
                  ]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(value) => updateField('height', value)}
                placeholder="170"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(value) => updateField('weight', value)}
                placeholder="70"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Activity Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.activityContainer}>
              {activityLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.activityButton,
                    formData.activityLevel === level.value && styles.activityButtonActive
                  ]}
                  onPress={() => updateField('activityLevel', level.value)}
                >
                  <Text style={[
                    styles.activityButtonText,
                    formData.activityLevel === level.value && styles.activityButtonTextActive
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goals */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.goalContainer}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.goalButton,
                    formData.goal === goal.value && styles.goalButtonActive
                  ]}
                  onPress={() => updateField('goal', goal.value)}
                >
                  <Ionicons 
                    name={goal.icon} 
                    size={20} 
                    color={formData.goal === goal.value ? '#ffffff' : '#64748b'} 
                  />
                  <Text style={[
                    styles.goalButtonText,
                    formData.goal === goal.value && styles.goalButtonTextActive
                  ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Protein Target (g)</Text>
              <TextInput
                style={styles.input}
                value={formData.proteinTarget}
                onChangeText={(value) => updateField('proteinTarget', value)}
                placeholder="56"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight Target (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weightTarget}
                onChangeText={(value) => updateField('weightTarget', value)}
                placeholder="68"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={calculateProfile}>
            <Text style={styles.calculateButtonText}>Calculate Profile</Text>
          </TouchableOpacity>

          {/* Results */}
          {results && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Your Results</Text>
              <View style={styles.resultRow}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{results.bmr}</Text>
                  <Text style={styles.resultLabel}>BMR (cal/day)</Text>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{results.tdee}</Text>
                  <Text style={styles.resultLabel}>TDEE (cal/day)</Text>
                </View>
              </View>
              <View style={styles.resultRow}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{results.targetCalories}</Text>
                  <Text style={styles.resultLabel}>Target Calories</Text>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultValue}>{results.proteinTarget}</Text>
                  <Text style={styles.resultLabel}>Protein Target (g)</Text>
                </View>
              </View>
            </View>
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
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  quote: {
    color: '#f1f5f9',
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
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
  row: {
    flexDirection: 'row',
  },
  genderContainer: {
    flexDirection: 'row',
  },
  genderButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginRight: 8,
  },
  genderButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  genderButtonText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#ffffff',
  },
  activityContainer: {
    gap: 8,
  },
  activityButton: {
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  activityButtonText: {
    color: '#f1f5f9',
    fontSize: 14,
  },
  activityButtonTextActive: {
    color: '#ffffff',
  },
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: '45%',
  },
  goalButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  goalButtonText: {
    color: '#f1f5f9',
    fontSize: 14,
    marginLeft: 8,
  },
  goalButtonTextActive: {
    color: '#ffffff',
  },
  calculateButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  resultCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
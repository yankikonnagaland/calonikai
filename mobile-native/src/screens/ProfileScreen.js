import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateProteinTarget } from '../utils/calculations';

export default function ProfileScreen() {
  const { state, actions } = useAppContext();
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderately_active',
    goal: 'maintain',
    proteinTarget: '',
  });
  const [results, setResults] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (state.userProfile) {
      setFormData(state.userProfile);
      calculateResults(state.userProfile);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [state.userProfile]);

  const calculateResults = (data) => {
    const { age, weight, height, gender, activityLevel, goal } = data;
    
    if (!age || !weight || !height) return;

    const bmr = calculateBMR(parseFloat(weight), parseFloat(height), parseInt(age), gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const targetCalories = calculateTargetCalories(tdee, goal);
    const proteinTarget = calculateProteinTarget(parseFloat(weight), goal);

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      proteinTarget: Math.round(proteinTarget),
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    calculateResults(formData);
  };

  const handleSave = () => {
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    actions.setUserProfile(formData);
    setIsEditing(false);
    Alert.alert('Success', 'Profile saved successfully!');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
    { value: 'extremely_active', label: 'Extremely Active (very hard exercise & physical job)' },
  ];

  const goals = [
    { value: 'lose_weight', label: 'Lose Weight', icon: 'trending-down' },
    { value: 'maintain', label: 'Maintain Weight', icon: 'remove' },
    { value: 'gain_weight', label: 'Gain Weight', icon: 'trending-up' },
    { value: 'build_muscle', label: 'Build Muscle', icon: 'fitness' },
  ];

  const renderGenderSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Gender</Text>
      <View style={styles.radioGroup}>
        {['male', 'female'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.radioButton,
              formData.gender === gender && styles.selectedRadio,
            ]}
            onPress={() => handleInputChange('gender', gender)}
            disabled={!isEditing}
          >
            <Text
              style={[
                styles.radioText,
                formData.gender === gender && styles.selectedRadioText,
              ]}
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGoalSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Goal</Text>
      <View style={styles.goalGrid}>
        {goals.map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[
              styles.goalButton,
              formData.goal === goal.value && styles.selectedGoal,
            ]}
            onPress={() => handleInputChange('goal', goal.value)}
            disabled={!isEditing}
          >
            <Ionicons
              name={goal.icon}
              size={24}
              color={formData.goal === goal.value ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.goalText,
                formData.goal === goal.value && styles.selectedGoalText,
              ]}
            >
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          {state.userProfile && !isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={20} color="#f97316" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Form */}
        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              placeholder="Enter your age"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg) *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.weight}
              onChangeText={(value) => handleInputChange('weight', value)}
              placeholder="Enter weight in kg"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height (cm) *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.height}
              onChangeText={(value) => handleInputChange('height', value)}
              placeholder="Enter height in cm"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          {renderGenderSelector()}
          {renderGoalSelector()}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <View style={styles.pickerContainer}>
              {activityLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.activityButton,
                    formData.activityLevel === level.value && styles.selectedActivity,
                  ]}
                  onPress={() => handleInputChange('activityLevel', level.value)}
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.activityText,
                      formData.activityLevel === level.value && styles.selectedActivityText,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Custom Protein Target (g/day)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.proteinTarget}
              onChangeText={(value) => handleInputChange('proteinTarget', value)}
              placeholder="Optional - leave blank for auto calculation"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          {isEditing && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                <Text style={styles.buttonText}>Calculate</Text>
              </TouchableOpacity>
              {state.userProfile && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save Profile</Text>
                </TouchableOpacity>
              )}
              {!state.userProfile && results && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Results */}
        {results && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Targets</Text>
            <View style={styles.resultsGrid}>
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.bmr}</Text>
                <Text style={styles.resultLabel}>BMR</Text>
                <Text style={styles.resultSubtext}>Base Metabolic Rate</Text>
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.tdee}</Text>
                <Text style={styles.resultLabel}>TDEE</Text>
                <Text style={styles.resultSubtext}>Total Daily Energy</Text>
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.targetCalories}</Text>
                <Text style={styles.resultLabel}>Target Calories</Text>
                <Text style={styles.resultSubtext}>Daily Goal</Text>
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.proteinTarget}</Text>
                <Text style={styles.resultLabel}>Protein Target</Text>
                <Text style={styles.resultSubtext}>Grams per day</Text>
              </View>
            </View>
          </View>
        )}

        {/* Motivational Quote */}
        <View style={styles.section}>
          <View style={styles.quoteCard}>
            <Ionicons name="star" size={24} color="#f97316" />
            <Text style={styles.quote}>
              "Success is the sum of small efforts repeated day in and day out."
            </Text>
            <Text style={styles.quoteAuthor}>- Robert Collier</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#f97316',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.6,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedRadio: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  radioText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  selectedRadioText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedGoal: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  goalText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  selectedGoalText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  pickerContainer: {
    gap: 8,
  },
  activityButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  selectedActivity: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  activityText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  selectedActivityText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 20,
  },
  calculateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resultCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
    marginTop: 4,
  },
  resultSubtext: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  quoteCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  quote: {
    fontSize: 16,
    color: '#f8fafc',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#64748b',
  },
});
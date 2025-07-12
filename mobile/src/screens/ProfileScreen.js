import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

export default function ProfileScreen({ user, sessionId, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    goal: 'maintain',
    proteinTarget: '',
    weightTarget: '',
  });

  // Calculation results
  const [calculations, setCalculations] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [sessionId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await ApiService.getUserProfile(sessionId);
      if (profileData) {
        setProfile(profileData);
        setFormData({
          age: profileData.age?.toString() || '',
          gender: profileData.gender || 'male',
          height: profileData.height?.toString() || '',
          weight: profileData.weight?.toString() || '',
          activityLevel: profileData.activityLevel || 'moderate',
          goal: profileData.goal || 'maintain',
          proteinTarget: profileData.proteinTarget?.toString() || '',
          weightTarget: profileData.weightTarget?.toString() || '',
        });
        if (profileData.bmr && profileData.tdee && profileData.targetCalories) {
          setCalculations({
            bmr: profileData.bmr,
            tdee: profileData.tdee,
            targetCalories: profileData.targetCalories,
            proteinTarget: profileData.proteinTarget,
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfile = () => {
    const age = parseInt(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);

    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill in age, height, and weight');
      return;
    }

    // BMR calculation (Mifflin-St Jeor Equation)
    let bmr;
    if (formData.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // TDEE calculation
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    const tdee = bmr * activityMultipliers[formData.activityLevel];

    // Target calories based on goal
    let targetCalories;
    switch (formData.goal) {
      case 'lose':
        targetCalories = tdee - 500; // 500 calorie deficit
        break;
      case 'gain':
        targetCalories = tdee + 500; // 500 calorie surplus
        break;
      case 'muscle':
        targetCalories = tdee + 300; // Moderate surplus for muscle building
        break;
      default:
        targetCalories = tdee; // Maintain weight
    }

    // Protein target (default 0.8g per kg body weight, or 2.0g for muscle building)
    const defaultProteinTarget = formData.goal === 'muscle' ? weight * 2.0 : weight * 0.8;
    const proteinTarget = parseFloat(formData.proteinTarget) || defaultProteinTarget;

    setCalculations({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      proteinTarget: Math.round(proteinTarget),
    });
  };

  const saveProfile = async () => {
    if (!calculations) {
      Alert.alert('Error', 'Please calculate your profile first');
      return;
    }

    try {
      setIsLoading(true);
      const profileData = {
        sessionId,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        proteinTarget: calculations.proteinTarget,
        weightTarget: parseFloat(formData.weightTarget) || null,
        bmr: calculations.bmr,
        tdee: calculations.tdee,
        targetCalories: calculations.targetCalories,
      };

      await ApiService.saveUserProfile(profileData);
      await loadProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error('Save profile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: onLogout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* User Info Header */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionText}>
              {user?.subscriptionStatus === 'premium' ? '👑 Premium' : 
               user?.subscriptionStatus === 'basic' ? '🔰 Basic' : 
               '🆓 Free'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <View style={styles.formContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons 
              name={isEditing ? "close" : "create-outline"} 
              size={20} 
              color="#10b981" 
            />
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={[styles.textInput, !isEditing && styles.disabledInput]}
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
            placeholder="Enter your age"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.genderContainer}>
            {['male', 'female'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  formData.gender === gender && styles.genderButtonActive,
                  !isEditing && styles.disabledButton
                ]}
                onPress={() => isEditing && setFormData({...formData, gender})}
                disabled={!isEditing}
              >
                <Text style={[
                  styles.genderButtonText,
                  formData.gender === gender && styles.genderButtonTextActive
                ]}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <TextInput
            style={[styles.textInput, !isEditing && styles.disabledInput]}
            value={formData.height}
            onChangeText={(text) => setFormData({...formData, height: text})}
            placeholder="Enter height in cm"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={[styles.textInput, !isEditing && styles.disabledInput]}
            value={formData.weight}
            onChangeText={(text) => setFormData({...formData, weight: text})}
            placeholder="Enter weight in kg"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Activity Level</Text>
          <View style={styles.activityContainer}>
            {[
              { key: 'sedentary', label: 'Sedentary' },
              { key: 'light', label: 'Light' },
              { key: 'moderate', label: 'Moderate' },
              { key: 'active', label: 'Active' },
              { key: 'veryActive', label: 'Very Active' },
            ].map((activity) => (
              <TouchableOpacity
                key={activity.key}
                style={[
                  styles.activityButton,
                  formData.activityLevel === activity.key && styles.activityButtonActive,
                  !isEditing && styles.disabledButton
                ]}
                onPress={() => isEditing && setFormData({...formData, activityLevel: activity.key})}
                disabled={!isEditing}
              >
                <Text style={[
                  styles.activityButtonText,
                  formData.activityLevel === activity.key && styles.activityButtonTextActive
                ]}>
                  {activity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Goal</Text>
          <View style={styles.goalContainer}>
            {[
              { key: 'lose', label: 'Lose Weight', icon: '⬇️' },
              { key: 'maintain', label: 'Maintain', icon: '➡️' },
              { key: 'gain', label: 'Gain Weight', icon: '⬆️' },
              { key: 'muscle', label: 'Build Muscle', icon: '💪' },
            ].map((goal) => (
              <TouchableOpacity
                key={goal.key}
                style={[
                  styles.goalButton,
                  formData.goal === goal.key && styles.goalButtonActive,
                  !isEditing && styles.disabledButton
                ]}
                onPress={() => isEditing && setFormData({...formData, goal: goal.key})}
                disabled={!isEditing}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalButtonText,
                  formData.goal === goal.key && styles.goalButtonTextActive
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.calculateButton} onPress={calculateProfile}>
              <Text style={styles.calculateButtonText}>Calculate Profile</Text>
            </TouchableOpacity>
            
            {calculations && (
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={saveProfile}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results */}
        {calculations && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Your Nutrition Targets</Text>
            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{calculations.bmr}</Text>
                <Text style={styles.resultLabel}>BMR (cal/day)</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{calculations.tdee}</Text>
                <Text style={styles.resultLabel}>TDEE (cal/day)</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{calculations.targetCalories}</Text>
                <Text style={styles.resultLabel}>Target Calories</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultValue}>{calculations.proteinTarget}</Text>
                <Text style={styles.resultLabel}>Protein (g/day)</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  subscriptionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  formContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#111827',
    color: '#9ca3af',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  genderButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#ffffff',
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  activityButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  activityButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  activityButtonTextActive: {
    color: '#ffffff',
  },
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalButton: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    minWidth: '45%',
  },
  goalButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  goalIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  goalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  goalButtonTextActive: {
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  calculateButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 30,
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultValue: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
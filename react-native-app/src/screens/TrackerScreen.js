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
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import FoodSearch from '../components/FoodSearch';
import MealSummary from '../components/MealSummary';
import FoodCamera from '../components/FoodCamera';
import NutritionSummary from '../components/NutritionSummary';

export default function TrackerScreen() {
  const { selectedDate, dispatch } = useApp();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleDateSelect = (date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date.dateString });
    setShowCalendar(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return "Today's Food Items";
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' Food Items';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Date Selection */}
        <View style={styles.header}>
          <Text style={styles.title}>Food Tracker</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Ionicons name="calendar" size={20} color="#f97316" />
            <Text style={styles.dateText}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        {showCalendar && (
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#f97316',
                }
              }}
              theme={{
                backgroundColor: '#1e293b',
                calendarBackground: '#1e293b',
                textSectionTitleColor: '#f1f5f9',
                selectedDayBackgroundColor: '#f97316',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#f97316',
                dayTextColor: '#f1f5f9',
                textDisabledColor: '#64748b',
                monthTextColor: '#f1f5f9',
                arrowColor: '#f97316',
              }}
            />
          </View>
        )}

        {/* Nutrition Summary */}
        <NutritionSummary />

        {/* Food Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Food</Text>
          <FoodSearch />
        </View>

        {/* Camera Button */}
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons name="camera" size={24} color="#ffffff" />
          <Text style={styles.cameraButtonText}>Analyze Food Photo</Text>
        </TouchableOpacity>

        {/* Current Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{formatDate(selectedDate)}</Text>
          <MealSummary />
        </View>

        {/* Food Camera Modal */}
        {showCamera && (
          <FoodCamera 
            isVisible={showCamera}
            onClose={() => setShowCamera(false)}
          />
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  dateText: {
    color: '#f1f5f9',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  cameraButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
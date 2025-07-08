import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const initialState = {
  user: null,
  selectedDate: new Date().toISOString().split('T')[0],
  meals: [],
  exercises: [],
  userProfile: null,
  dailySummary: null,
  loading: false,
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_MEALS':
      return { ...state, meals: action.payload };
    case 'ADD_MEAL':
      return { ...state, meals: [...state.meals, action.payload] };
    case 'REMOVE_MEAL':
      return { ...state, meals: state.meals.filter(meal => meal.id !== action.payload) };
    case 'SET_EXERCISES':
      return { ...state, exercises: action.payload };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };
    case 'REMOVE_EXERCISE':
      return { ...state, exercises: state.exercises.filter(exercise => exercise.id !== action.payload) };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_DAILY_SUMMARY':
      return { ...state, dailySummary: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted data on app start
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Save data whenever state changes
  useEffect(() => {
    saveDataToStorage();
  }, [state.meals, state.exercises, state.userProfile, state.selectedDate]);

  const loadPersistedData = async () => {
    try {
      const savedMeals = await AsyncStorage.getItem('meals');
      const savedExercises = await AsyncStorage.getItem('exercises');
      const savedProfile = await AsyncStorage.getItem('userProfile');
      const savedDate = await AsyncStorage.getItem('selectedDate');

      if (savedMeals) {
        dispatch({ type: 'SET_MEALS', payload: JSON.parse(savedMeals) });
      }
      if (savedExercises) {
        dispatch({ type: 'SET_EXERCISES', payload: JSON.parse(savedExercises) });
      }
      if (savedProfile) {
        dispatch({ type: 'SET_USER_PROFILE', payload: JSON.parse(savedProfile) });
      }
      if (savedDate) {
        dispatch({ type: 'SET_SELECTED_DATE', payload: savedDate });
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const saveDataToStorage = async () => {
    try {
      await AsyncStorage.setItem('meals', JSON.stringify(state.meals));
      await AsyncStorage.setItem('exercises', JSON.stringify(state.exercises));
      await AsyncStorage.setItem('userProfile', JSON.stringify(state.userProfile));
      await AsyncStorage.setItem('selectedDate', state.selectedDate);
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  };

  const value = {
    ...state,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
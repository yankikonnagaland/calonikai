import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
  user: null,
  sessionId: null,
  selectedDate: new Date().toISOString().split('T')[0],
  meals: [],
  exercises: [],
  userProfile: null,
  dailySummary: null,
  foods: [],
  isLoading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_SESSION_ID: 'SET_SESSION_ID',
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_MEALS: 'SET_MEALS',
  ADD_MEAL: 'ADD_MEAL',
  REMOVE_MEAL: 'REMOVE_MEAL',
  SET_EXERCISES: 'SET_EXERCISES',
  ADD_EXERCISE: 'ADD_EXERCISE',
  REMOVE_EXERCISE: 'REMOVE_EXERCISE',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_DAILY_SUMMARY: 'SET_DAILY_SUMMARY',
  SET_FOODS: 'SET_FOODS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_DATA: 'CLEAR_DATA',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    case ActionTypes.SET_SESSION_ID:
      return { ...state, sessionId: action.payload };
    case ActionTypes.SET_SELECTED_DATE:
      return { ...state, selectedDate: action.payload };
    case ActionTypes.SET_MEALS:
      return { ...state, meals: action.payload };
    case ActionTypes.ADD_MEAL:
      return { ...state, meals: [...state.meals, action.payload] };
    case ActionTypes.REMOVE_MEAL:
      return { 
        ...state, 
        meals: state.meals.filter(meal => meal.id !== action.payload) 
      };
    case ActionTypes.SET_EXERCISES:
      return { ...state, exercises: action.payload };
    case ActionTypes.ADD_EXERCISE:
      return { ...state, exercises: [...state.exercises, action.payload] };
    case ActionTypes.REMOVE_EXERCISE:
      return { 
        ...state, 
        exercises: state.exercises.filter(exercise => exercise.id !== action.payload) 
      };
    case ActionTypes.SET_USER_PROFILE:
      return { ...state, userProfile: action.payload };
    case ActionTypes.SET_DAILY_SUMMARY:
      return { ...state, dailySummary: action.payload };
    case ActionTypes.SET_FOODS:
      return { ...state, foods: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.CLEAR_DATA:
      return { ...initialState, sessionId: state.sessionId };
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Generate session ID on app start
  useEffect(() => {
    const initializeSession = async () => {
      try {
        let sessionId = await AsyncStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem('sessionId', sessionId);
        }
        dispatch({ type: ActionTypes.SET_SESSION_ID, payload: sessionId });
        
        // Load cached data
        await loadCachedData(sessionId);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
  }, []);

  // Load cached data from AsyncStorage
  const loadCachedData = async (sessionId) => {
    try {
      const [cachedMeals, cachedExercises, cachedProfile] = await Promise.all([
        AsyncStorage.getItem(`meals_${sessionId}_${state.selectedDate}`),
        AsyncStorage.getItem(`exercises_${sessionId}_${state.selectedDate}`),
        AsyncStorage.getItem(`profile_${sessionId}`),
      ]);

      if (cachedMeals) {
        dispatch({ type: ActionTypes.SET_MEALS, payload: JSON.parse(cachedMeals) });
      }
      if (cachedExercises) {
        dispatch({ type: ActionTypes.SET_EXERCISES, payload: JSON.parse(cachedExercises) });
      }
      if (cachedProfile) {
        dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: JSON.parse(cachedProfile) });
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  // Save data to AsyncStorage
  const saveToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  };

  // Action creators
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setSelectedDate: (date) => {
      dispatch({ type: ActionTypes.SET_SELECTED_DATE, payload: date });
      // Load data for new date
      loadCachedData(state.sessionId);
    },
    setMeals: (meals) => {
      dispatch({ type: ActionTypes.SET_MEALS, payload: meals });
      saveToStorage(`meals_${state.sessionId}_${state.selectedDate}`, meals);
    },
    addMeal: (meal) => {
      const newMeal = { ...meal, id: Date.now() };
      dispatch({ type: ActionTypes.ADD_MEAL, payload: newMeal });
      const updatedMeals = [...state.meals, newMeal];
      saveToStorage(`meals_${state.sessionId}_${state.selectedDate}`, updatedMeals);
      return newMeal;
    },
    removeMeal: (mealId) => {
      dispatch({ type: ActionTypes.REMOVE_MEAL, payload: mealId });
      const updatedMeals = state.meals.filter(meal => meal.id !== mealId);
      saveToStorage(`meals_${state.sessionId}_${state.selectedDate}`, updatedMeals);
    },
    setExercises: (exercises) => {
      dispatch({ type: ActionTypes.SET_EXERCISES, payload: exercises });
      saveToStorage(`exercises_${state.sessionId}_${state.selectedDate}`, exercises);
    },
    addExercise: (exercise) => {
      const newExercise = { ...exercise, id: Date.now() };
      dispatch({ type: ActionTypes.ADD_EXERCISE, payload: newExercise });
      const updatedExercises = [...state.exercises, newExercise];
      saveToStorage(`exercises_${state.sessionId}_${state.selectedDate}`, updatedExercises);
      return newExercise;
    },
    removeExercise: (exerciseId) => {
      dispatch({ type: ActionTypes.REMOVE_EXERCISE, payload: exerciseId });
      const updatedExercises = state.exercises.filter(exercise => exercise.id !== exerciseId);
      saveToStorage(`exercises_${state.sessionId}_${state.selectedDate}`, updatedExercises);
    },
    setUserProfile: (profile) => {
      dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: profile });
      saveToStorage(`profile_${state.sessionId}`, profile);
    },
    setDailySummary: (summary) => {
      dispatch({ type: ActionTypes.SET_DAILY_SUMMARY, payload: summary });
      saveToStorage(`summary_${state.sessionId}_${state.selectedDate}`, summary);
    },
    setFoods: (foods) => dispatch({ type: ActionTypes.SET_FOODS, payload: foods }),
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearData: () => dispatch({ type: ActionTypes.CLEAR_DATA }),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};
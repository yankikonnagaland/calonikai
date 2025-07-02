import axios from 'axios';

// Use your existing backend URL
const API_BASE_URL = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Types (shared with your web app)
export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
  portionSize: string;
  defaultUnit: string;
}

export interface MealItem {
  id: number;
  sessionId: string;
  foodId: number;
  quantity: number;
  unit: string;
  date: string;
  food: Food;
}

export interface UserProfile {
  id: number;
  sessionId: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  weightGoal: string;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
}

export interface DailySummary {
  id: number;
  sessionId: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  netCalories: number;
}

// API Functions
export const apiService = {
  // Food Search
  searchFoods: async (query: string): Promise<Food[]> => {
    const response = await api.get(`/foods/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Meal Management
  getMealItems: async (sessionId: string, date: string): Promise<MealItem[]> => {
    const response = await api.get(`/meal/${sessionId}/${date}`);
    return response.data;
  },

  addMealItem: async (mealItem: {
    sessionId: string;
    foodId: number;
    quantity: number;
    unit: string;
    date: string;
  }): Promise<MealItem> => {
    const response = await api.post('/meal', mealItem);
    return response.data;
  },

  removeMealItem: async (id: number): Promise<void> => {
    await api.delete(`/meal/${id}`);
  },

  clearMeal: async (sessionId: string, date: string): Promise<void> => {
    await api.delete(`/meal/clear/${sessionId}/${date}`);
  },

  // Profile Management
  saveUserProfile: async (profile: Omit<UserProfile, 'id'>): Promise<UserProfile> => {
    const response = await api.post('/user-profile', profile);
    return response.data;
  },

  getUserProfile: async (sessionId: string): Promise<UserProfile | null> => {
    try {
      const response = await api.get(`/user-profile/${sessionId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Daily Summary
  saveDailySummary: async (summary: Omit<DailySummary, 'id'>): Promise<DailySummary> => {
    const response = await api.post('/daily-summary', summary);
    return response.data;
  },

  getDailySummary: async (sessionId: string, date: string): Promise<DailySummary | null> => {
    try {
      const response = await api.get(`/daily-summary/${sessionId}/${date}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Image Analysis
  analyzeFood: async (imageUri: string): Promise<any> => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food-image.jpg',
    } as any);

    const response = await api.post('/analyze-food', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Unit Selection
  getUnitSelection: async (foodName: string): Promise<{ unit: string; unitOptions: string[] }> => {
    const response = await api.get(`/unit-selection/${encodeURIComponent(foodName)}`);
    return response.data;
  },
};
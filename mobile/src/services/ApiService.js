import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev';

export class ApiService {
  static async makeRequest(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Food Search
  static async searchFoods(query) {
    return await this.makeRequest(`/api/enhanced-food-search?q=${encodeURIComponent(query)}`);
  }

  // Meals
  static async getMeals(sessionId, date) {
    return await this.makeRequest(`/api/meal/${sessionId}/${date}`);
  }

  static async addMealItem(mealData) {
    return await this.makeRequest('/api/meal', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  static async removeMealItem(itemId) {
    return await this.makeRequest(`/api/meal/${itemId}`, {
      method: 'DELETE',
    });
  }

  static async submitDailySummary(summaryData) {
    return await this.makeRequest('/api/daily-summary', {
      method: 'POST',
      body: JSON.stringify(summaryData),
    });
  }

  // User Profile
  static async getUserProfile(sessionId) {
    return await this.makeRequest(`/api/profile/${sessionId}`);
  }

  static async saveUserProfile(profileData) {
    return await this.makeRequest('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Exercises
  static async getExercises(sessionId, date) {
    return await this.makeRequest(`/api/exercise/${sessionId}?date=${date}`);
  }

  static async addExercise(exerciseData) {
    return await this.makeRequest('/api/exercise', {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
  }

  // Dashboard Analytics
  static async getDailySummary(sessionId, date) {
    return await this.makeRequest(`/api/daily-summary/${sessionId}/${date}`);
  }

  static async getDailyWeight(sessionId, date) {
    return await this.makeRequest(`/api/daily-weight/${sessionId}/${date}`);
  }

  static async saveDailyWeight(weightData) {
    return await this.makeRequest('/api/daily-weight', {
      method: 'POST',
      body: JSON.stringify(weightData),
    });
  }

  // Usage Stats
  static async getUsageStats() {
    return await this.makeRequest('/api/usage-stats');
  }

  // AI Food Analysis
  static async analyzeFood(imageBase64) {
    return await this.makeRequest('/api/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    });
  }
}
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://calonik.ai/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Food Search
  async searchFood(query: string, sessionId: string): Promise<any[]> {
    return this.makeRequest(`/food/search`, {
      method: 'POST',
      body: JSON.stringify({ query, sessionId }),
    });
  }

  // Meals
  async getMeals(sessionId: string, date: string): Promise<any[]> {
    return this.makeRequest(`/meal/${sessionId}/${date}`);
  }

  async addMeal(mealData: any): Promise<any> {
    return this.makeRequest('/meal', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  async removeMeal(id: number): Promise<void> {
    return this.makeRequest(`/meal/${id}`, {
      method: 'DELETE',
    });
  }

  async clearMeals(sessionId: string, date: string): Promise<void> {
    return this.makeRequest(`/meal/clear/${sessionId}/${date}`, {
      method: 'DELETE',
    });
  }

  // Daily Summary
  async submitDailySummary(summaryData: any): Promise<any> {
    return this.makeRequest('/daily-summary', {
      method: 'POST',
      body: JSON.stringify(summaryData),
    });
  }

  async getDailySummary(sessionId: string, date: string): Promise<any> {
    return this.makeRequest(`/daily-summary/${sessionId}/${date}`);
  }

  // User Profile
  async getUserProfile(sessionId: string): Promise<any> {
    return this.makeRequest(`/profile/${sessionId}`);
  }

  async saveUserProfile(profileData: any): Promise<any> {
    return this.makeRequest('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Exercises
  async getExercises(sessionId: string, date?: string): Promise<any[]> {
    const endpoint = date ? `/exercise/${sessionId}?date=${date}` : `/exercise/${sessionId}`;
    return this.makeRequest(endpoint);
  }

  async addExercise(exerciseData: any): Promise<any> {
    return this.makeRequest('/exercise', {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
  }

  async removeExercise(id: number): Promise<void> {
    return this.makeRequest(`/exercise/${id}`, {
      method: 'DELETE',
    });
  }

  // Daily Weight
  async getDailyWeight(sessionId: string, date: string): Promise<any> {
    return this.makeRequest(`/daily-weight/${sessionId}/${date}`);
  }

  async saveDailyWeight(weightData: any): Promise<any> {
    return this.makeRequest('/daily-weight', {
      method: 'POST',
      body: JSON.stringify(weightData),
    });
  }

  // Usage Stats
  async getUsageStats(sessionId: string): Promise<any> {
    return this.makeRequest(`/usage-stats?sessionId=${sessionId}`);
  }

  // AI Food Analysis
  async analyzeFood(imageData: string, sessionId: string): Promise<any> {
    return this.makeRequest('/analyze-food', {
      method: 'POST',
      body: JSON.stringify({ image: imageData, sessionId }),
    });
  }

  // Unit Selection
  async getUnitSelection(foodName: string): Promise<string[]> {
    return this.makeRequest(`/unit-selection/${encodeURIComponent(foodName)}`);
  }
}

export const apiService = new ApiService();
export default apiService;
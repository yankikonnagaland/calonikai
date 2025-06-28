import { vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

// Test utilities for consistent testing across components
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Mock data generators
export const mockUser = {
  id: 'test-user-123',
  email: 'test@calonik.ai',
  name: 'Test User',
  subscription_status: 'premium',
  created_at: new Date().toISOString()
}

export const mockUserProfile = {
  id: 1,
  sessionId: 'test-session',
  age: 25,
  height: 170.69, // 5.6 feet converted to cm
  weight: 70,
  gender: 'male' as const,
  activityLevel: 'moderate' as const,
  weightGoal: 'lose' as const,
  targetWeight: 65,
  bmr: 1680,
  tdee: 2352,
  targetCalories: 1852,
  dailyProteinTarget: 56
}

export const mockFood = {
  id: 1,
  name: 'Rice',
  calories: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
  category: 'grains'
}

export const mockMealItem = {
  id: 1,
  sessionId: 'test-session',
  foodId: 1,
  quantity: 2,
  unit: 'medium portion',
  calories: 260,
  protein: 5.4,
  carbs: 56,
  fat: 0.6,
  date: '2025-06-28',
  food: mockFood
}

export const mockExercise = {
  id: 1,
  sessionId: 'test-session',
  type: 'running',
  exerciseName: 'Running',
  duration: 30,
  caloriesBurned: 300,
  date: '2025-06-28',
  distanceKm: 5,
  intensityLevel: 'Sub 2' as const,
  heartRate: 140,
  terrain: 'flat',
  usesSmartwatch: true,
  completedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
}

export const mockDailySummary = {
  id: 1,
  sessionId: 'test-session',
  date: '2025-06-28',
  totalCalories: 1800,
  totalProtein: 80,
  totalCarbs: 200,
  totalFat: 60,
  mealItems: [mockMealItem]
}

export const mockDailyWeight = {
  id: 1,
  sessionId: 'test-session',
  date: '2025-06-28',
  weight: 75.5
}

export const mockUsageStats = {
  photos: 2,
  meals: 8,
  isPremium: true,
  limits: { photos: 5, meals: 20 },
  remaining: { photos: 3, meals: 12 }
}

// API response helpers
export const mockApiResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data)
})

export const mockApiError = (message = 'API Error', status = 500) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message })
})

// Component props helpers
export const defaultFoodSearchProps = {
  selectedDate: '2025-06-28',
  sessionId: 'test-session',
  onFoodSelect: vi.fn()
}

export const defaultExerciseTrackerProps = {
  selectedDate: '2025-06-28',
  sessionId: 'test-session'
}

export const defaultMealSummaryProps = {
  selectedDate: '2025-06-28',
  sessionId: 'test-session',
  onSubmit: vi.fn(),
  onClear: vi.fn(),
  isSubmitting: false,
  isClearing: false
}

export const defaultUserProfileProps = {
  sessionId: 'test-session'
}

export const defaultDashboardProps = {
  sessionId: 'test-session'
}

export const defaultFoodCameraProps = {
  selectedDate: '2025-06-28',
  sessionId: 'test-session',
  onFoodDetected: vi.fn()
}

// Test data validation helpers
export const validateCalorieCalculation = (baseCalories: number, multiplier: number, expected: number) => {
  const calculated = Math.round(baseCalories * multiplier)
  return calculated === expected
}

export const validateBMRCalculation = (weight: number, height: number, age: number, gender: 'male' | 'female') => {
  // Mifflin-St Jeor equation
  const baseBMR = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161
}

export const validateTDEECalculation = (bmr: number, activityLevel: string) => {
  const multipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'extra': 1.9
  }
  return Math.round(bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.55))
}

export const validateProteinTarget = (weight: number, proteinPerKg = 0.8) => {
  return Math.floor(weight * proteinPerKg)
}

// Mock browser APIs
export const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
    getVideoTracks: () => [{ stop: vi.fn() }]
  })
}

export const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}

// Date helpers for consistent testing
export const getTestDate = (offset = 0) => {
  const date = new Date('2025-06-28T10:00:00Z')
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

export const formatTestDate = (dateString: string) => {
  return new Date(dateString + 'T00:00:00Z').toISOString().split('T')[0]
}

// Storage mock helpers
export const createMockStorage = () => ({
  getAllFoods: vi.fn().mockResolvedValue([mockFood]),
  searchFoods: vi.fn().mockResolvedValue([mockFood]),
  getFoodById: vi.fn().mockResolvedValue(mockFood),
  addMealItem: vi.fn().mockResolvedValue(mockMealItem),
  getMealItems: vi.fn().mockResolvedValue([mockMealItem]),
  removeMealItem: vi.fn().mockResolvedValue(true),
  clearMeal: vi.fn().mockResolvedValue(true),
  saveUserProfile: vi.fn().mockResolvedValue(mockUserProfile),
  getUserProfile: vi.fn().mockResolvedValue(mockUserProfile),
  addExercise: vi.fn().mockResolvedValue(mockExercise),
  getExercises: vi.fn().mockResolvedValue([mockExercise]),
  removeExercise: vi.fn().mockResolvedValue(true),
  saveDailySummary: vi.fn().mockResolvedValue(mockDailySummary),
  getDailySummary: vi.fn().mockResolvedValue(mockDailySummary),
  saveDailyWeight: vi.fn().mockResolvedValue(mockDailyWeight),
  getDailyWeight: vi.fn().mockResolvedValue(mockDailyWeight),
  canUserPerformAction: vi.fn().mockResolvedValue(true),
  trackUsage: vi.fn().mockResolvedValue(undefined)
})

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock navigator.mediaDevices
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: mockMediaDevices
  })
}
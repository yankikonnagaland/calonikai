export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionSize: string;
  category: string;
  defaultUnit: string;
  // AI-detected smart portion data (optional)
  smartPortionGrams?: number | null;
  smartCalories?: number | null;
  smartProtein?: number | null;
  smartCarbs?: number | null;
  smartFat?: number | null;
  aiConfidence?: number | null;
}

export interface MealItem {
  id: number;
  sessionId: string;
  foodId: number;
  quantity: number;
  unit: string;
  createdAt: Date | null;
}

export interface MealItemWithFood extends MealItem {
  food: Food;
}

export interface UserProfile {
  id: number;
  sessionId: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  bodyType: string;
  activityLevel: string;
  weightGoal: string;
  bmr: number | null;
  tdee: number | null;
  targetCalories: number | null;
  createdAt: Date | null;
}

export interface Exercise {
  id: number;
  sessionId: string;
  type: string;
  duration: number;
  caloriesBurned: number;
  completedAt: Date | null;
}

export interface Alternative {
  name: string;
  calorieDiff: number;
  reason: string;
}

export interface AlternativesResponse {
  alternatives: Alternative[];
  tip: string;
}

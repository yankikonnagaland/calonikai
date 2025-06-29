// Temporary in-memory storage to bypass database connection issues
import type { 
  Food, 
  MealItem, 
  UserProfile, 
  Exercise, 
  DailySummary, 
  MealItemWithFood, 
  InsertMealItem, 
  InsertUserProfile, 
  InsertExercise, 
  InsertDailySummary,
  User,
  UpsertUser
} from "@shared/schema";

// In-memory storage maps
const memoryFoods = new Map<number, Food>();
const memoryMealItems = new Map<string, MealItem[]>();
const memoryProfiles = new Map<string, UserProfile>();
const memoryExercises = new Map<string, Exercise[]>();
const memoryDailySummaries = new Map<string, DailySummary>();
const memoryUsers = new Map<string, User>();
const memoryUsage = new Map<string, number>();

// Initialize with some basic Indian foods
const initializeFoods = () => {
  const basicFoods: Food[] = [
    { id: 1, name: "Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, portionSize: "100g", category: "Main Course", defaultUnit: "medium portion" },
    { id: 2, name: "Chicken Curry", calories: 165, protein: 25, carbs: 5, fat: 6, portionSize: "100g", category: "Main Course", defaultUnit: "medium portion" },
    { id: 3, name: "Dal", calories: 120, protein: 8, carbs: 20, fat: 1, portionSize: "100g", category: "Main Course", defaultUnit: "medium portion" },
    { id: 4, name: "Roti", calories: 250, protein: 8, carbs: 50, fat: 2, portionSize: "1 piece", category: "Bread", defaultUnit: "piece" },
    { id: 5, name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portionSize: "1 medium", category: "Fruits", defaultUnit: "piece" },
    { id: 6, name: "Tea", calories: 2, protein: 0, carbs: 1, fat: 0, portionSize: "1 cup", category: "Beverages", defaultUnit: "cup" },
    { id: 7, name: "Samosa", calories: 308, protein: 6, carbs: 32, fat: 18, portionSize: "1 piece", category: "Snacks", defaultUnit: "piece" }
  ];
  
  basicFoods.forEach(food => memoryFoods.set(food.id, food));
};

initializeFoods();

export class FallbackStorage {
  // Food operations
  async getAllFoods(): Promise<Food[]> {
    return Array.from(memoryFoods.values());
  }

  async searchFoods(query: string): Promise<Food[]> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Special handling for water - always return 0 calories
    if (normalizedQuery.includes("water")) {
      return [{
        id: 9999999,
        name: "Water",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        portionSize: "100ml",
        category: "Beverage",
        defaultUnit: "ml"
      }];
    }
    
    const foods = Array.from(memoryFoods.values());
    return foods.filter(food => 
      food.name.toLowerCase().includes(normalizedQuery) ||
      food.category.toLowerCase().includes(normalizedQuery)
    );
  }

  async getFoodById(id: number): Promise<Food | undefined> {
    return memoryFoods.get(id);
  }

  async storeAiFood(food: Food): Promise<void> {
    memoryFoods.set(food.id, food);
  }

  // Meal operations
  async getMealItems(sessionId: string, date?: string): Promise<MealItemWithFood[]> {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = date || today;
    
    console.log(`FallbackStorage: Getting meal items for session ${sessionId} on date ${targetDate}`);
    console.log(`FallbackStorage: Available sessions:`, Array.from(memoryMealItems.keys()));
    
    const meals = memoryMealItems.get(sessionId) || [];
    console.log(`FallbackStorage: Found ${meals.length} total meals for session ${sessionId}`);
    const mealItemsWithFood: MealItemWithFood[] = [];
    
    for (const meal of meals) {
      console.log(`FallbackStorage: Checking meal with date ${meal.date} against target ${targetDate}`);
      // Filter by date if meal has date field
      if (meal.date && meal.date !== targetDate) {
        console.log(`FallbackStorage: Skipping meal due to date mismatch`);
        continue;
      }
      
      const food = memoryFoods.get(meal.foodId);
      console.log(`FallbackStorage: Looking for food ${meal.foodId}, found:`, !!food);
      if (food) {
        mealItemsWithFood.push({
          id: meal.id,
          sessionId: meal.sessionId,
          foodId: meal.foodId,
          quantity: meal.quantity,
          unit: meal.unit,
          date: meal.date || targetDate,
          createdAt: meal.createdAt,
          food: food
        });
      } else {
        // Create a fallback food for missing foods
        const fallbackFood = {
          id: meal.foodId,
          name: `Food ${meal.foodId}`,
          calories: 100,
          protein: 5,
          carbs: 15,
          fat: 3,
          portionSize: "100g",
          category: "Unknown",
          defaultUnit: meal.unit
        };
        memoryFoods.set(meal.foodId, fallbackFood);
        mealItemsWithFood.push({
          id: meal.id,
          sessionId: meal.sessionId,
          foodId: meal.foodId,
          quantity: meal.quantity,
          unit: meal.unit,
          date: meal.date || targetDate,
          createdAt: meal.createdAt,
          food: fallbackFood
        });
      }
    }
    
    console.log(`FallbackStorage: Found ${mealItemsWithFood.length} meal items for date ${targetDate}`);
    return mealItemsWithFood;
  }

  async addMealItem(mealItem: InsertMealItem): Promise<MealItem> {
    const sessionMeals = memoryMealItems.get(mealItem.sessionId) || [];
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`FallbackStorage: Adding meal item for session ${mealItem.sessionId} on date ${mealItem.date || today}`);
    
    const newMeal: MealItem = {
      id: Date.now() + Math.random(), // Simple ID generation
      ...mealItem,
      date: mealItem.date || today,
      createdAt: new Date()
    };
    
    sessionMeals.push(newMeal);
    memoryMealItems.set(mealItem.sessionId, sessionMeals);
    console.log(`FallbackStorage: Stored meal, total meals for session ${mealItem.sessionId}:`, sessionMeals.length);
    console.log(`FallbackStorage: All meals in storage:`, sessionMeals.map(m => ({ id: m.id, foodId: m.foodId, date: m.date })));
    return newMeal;
  }

  async removeMealItem(id: number): Promise<boolean> {
    console.log(`Attempting to remove meal item with ID: ${id}`);
    for (const [sessionId, meals] of memoryMealItems.entries()) {
      console.log(`Checking session ${sessionId}, meals:`, meals.map(m => ({ id: m.id, foodId: m.foodId })));
      const index = meals.findIndex(meal => meal.id === id);
      if (index !== -1) {
        console.log(`Found meal item at index ${index}, removing...`);
        meals.splice(index, 1);
        memoryMealItems.set(sessionId, meals);
        console.log(`Meal item removed successfully. Remaining meals:`, meals.length);
        return true;
      }
    }
    console.log(`Meal item with ID ${id} not found`);
    return false;
  }

  async clearMeal(sessionId: string, date?: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const targetDate = date || today;
      
      console.log(`FallbackStorage: Clearing meal items for session ${sessionId} on date ${targetDate}`);
      
      if (date) {
        // Clear only items for specific date
        const sessionMeals = memoryMealItems.get(sessionId) || [];
        const filteredMeals = sessionMeals.filter(meal => meal.date !== targetDate);
        memoryMealItems.set(sessionId, filteredMeals);
      } else {
        // Clear all meals for session
        memoryMealItems.set(sessionId, []);
      }
      
      return true;
    } catch (error) {
      console.error("Error clearing meal:", error);
      return false;
    }
  }

  // Profile operations
  async saveUserProfile(profile: InsertUserProfile & { bmr: number; tdee: number; targetCalories: number }): Promise<UserProfile> {
    const userProfile: UserProfile = {
      id: Date.now(),
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    memoryProfiles.set(profile.sessionId, userProfile);
    return userProfile;
  }

  async getUserProfile(sessionId: string): Promise<UserProfile | undefined> {
    return memoryProfiles.get(sessionId);
  }

  // Exercise operations
  async addExercise(exercise: InsertExercise): Promise<Exercise> {
    const sessionExercises = memoryExercises.get(exercise.sessionId) || [];
    const today = new Date().toISOString().split('T')[0];
    const newExercise: Exercise = {
      id: Date.now() + Math.random(),
      ...exercise,
      date: exercise.date || today,
      createdAt: new Date()
    };
    
    sessionExercises.push(newExercise);
    memoryExercises.set(exercise.sessionId, sessionExercises);
    console.log(`Exercise added for session ${exercise.sessionId} on date ${newExercise.date}:`, newExercise.exerciseName || newExercise.type);
    console.log(`Total exercises for session: ${sessionExercises.length}`);
    return newExercise;
  }

  async getExercises(sessionId: string, date?: string): Promise<Exercise[]> {
    const allExercises = memoryExercises.get(sessionId) || [];
    console.log(`Getting exercises for session ${sessionId}, date: ${date || 'all'}`);
    console.log(`Total exercises in storage: ${allExercises.length}`);
    
    // If no date specified, return all exercises
    if (!date) {
      return allExercises;
    }
    
    // Filter exercises by date
    const filteredExercises = allExercises.filter(exercise => {
      const exerciseDate = exercise.date || new Date(exercise.createdAt || new Date()).toISOString().split('T')[0];
      return exerciseDate === date;
    });
    
    console.log(`Filtered exercises for date ${date}: ${filteredExercises.length}`);
    return filteredExercises;
  }

  async removeExercise(id: number): Promise<boolean> {
    for (const [sessionId, exercises] of memoryExercises.entries()) {
      const index = exercises.findIndex(ex => ex.id === id);
      if (index !== -1) {
        exercises.splice(index, 1);
        memoryExercises.set(sessionId, exercises);
        return true;
      }
    }
    return false;
  }

  async clearExercises(sessionId: string): Promise<boolean> {
    memoryExercises.set(sessionId, []);
    return true;
  }

  // Daily summary operations
  async saveDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
    const key = `${summary.sessionId}-${summary.date}`;
    const existingSummary = memoryDailySummaries.get(key);
    
    const dailySummary: DailySummary = {
      id: existingSummary?.id || Date.now(),
      ...summary,
      createdAt: existingSummary?.createdAt || new Date()
    };
    
    memoryDailySummaries.set(key, dailySummary);
    return dailySummary;
  }

  async getDailySummary(sessionId: string, date: string): Promise<DailySummary | undefined> {
    const key = `${sessionId}-${date}`;
    return memoryDailySummaries.get(key);
  }

  async getDailySummaries(sessionId: string): Promise<DailySummary[]> {
    const summaries: DailySummary[] = [];
    for (const [key, summary] of memoryDailySummaries.entries()) {
      if (key.startsWith(sessionId + '-')) {
        summaries.push(summary);
      }
    }
    return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // User operations (required for Firebase Auth)
  async getUser(id: string): Promise<User | undefined> {
    return memoryUsers.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of memoryUsers.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const newUser: User = {
      id: userData.id!,
      email: userData.email!,
      password: userData.password || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      stripeCustomerId: userData.stripeCustomerId || null,
      stripeSubscriptionId: userData.stripeSubscriptionId || null,
      razorpayCustomerId: userData.razorpayCustomerId || null,
      razorpaySubscriptionId: userData.razorpaySubscriptionId || null,
      subscriptionStatus: userData.subscriptionStatus || "free",
      subscriptionEndsAt: userData.subscriptionEndsAt || null,
      premiumActivatedAt: userData.premiumActivatedAt || null,
      freeCreditsUsed: userData.freeCreditsUsed || 0,
      freePhotosUsed: userData.freePhotosUsed || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    memoryUsers.set(newUser.id, newUser);
    return newUser;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = memoryUsers.get(user.id);
    const newUser: User = {
      ...existingUser,
      ...user,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date()
    };
    memoryUsers.set(user.id, newUser);
    return newUser;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const user = memoryUsers.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId || null,
      updatedAt: new Date()
    };
    
    memoryUsers.set(userId, updatedUser);
    return updatedUser;
  }

  // Usage tracking operations
  async trackUsage(userId: string, actionType: "meal_add" | "photo_analyze"): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}-${actionType}-${today}`;
    const currentCount = memoryUsage.get(key) || 0;
    memoryUsage.set(key, currentCount + 1);
  }

  async getUserUsage(userId: string, actionType: "meal_add" | "photo_analyze", date: string): Promise<number> {
    const key = `${userId}-${actionType}-${date}`;
    return memoryUsage.get(key) || 0;
  }

  async canUserPerformAction(userId: string, actionType: "meal_add" | "photo_analyze"): Promise<boolean> {
    // Admin users have unlimited access
    if (userId === "admin_testing_user") {
      return true;
    }

    const user = await this.getUser(userId);
    const today = new Date().toISOString().split('T')[0];
    const usage = await this.getUserUsage(userId, actionType, today);
    
    // Premium users have highest limits
    if (user?.subscriptionStatus === 'premium') {
      const premiumLimits = {
        meal_add: 20,
        photo_analyze: 5
      };
      return usage < premiumLimits[actionType];
    }
    
    // Basic users have moderate limits
    if (user?.subscriptionStatus === 'basic') {
      const basicLimits = {
        meal_add: 5,  // 5 food searches per day
        photo_analyze: 2  // 2 photo scans per day
      };
      return usage < basicLimits[actionType];
    }
    
    // Free limits
    const freeLimits = {
      meal_add: 1,
      photo_analyze: 2
    };
    
    return usage < freeLimits[actionType];
  }

  async activatePremiumSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User> {
    const user = await this.getUser(userId) || {
      id: userId,
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      subscriptionStatus: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set subscription to end 1 month from now
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const premiumUser: User = {
      ...user,
      subscriptionStatus: 'premium',
      subscriptionEndsAt: subscriptionEndDate,
      razorpayCustomerId: razorpayData.customerId || null,
      razorpaySubscriptionId: razorpayData.subscriptionId || null,
      premiumActivatedAt: new Date(),
      updatedAt: new Date()
    };

    memoryUsers.set(userId, premiumUser);
    return premiumUser;
  }

  async activateBasicSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User> {
    const user = await this.getUser(userId) || {
      id: userId,
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      subscriptionStatus: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set subscription to end 1 month from now
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const basicUser: User = {
      ...user,
      subscriptionStatus: 'basic',
      subscriptionEndsAt: subscriptionEndDate,
      razorpayCustomerId: razorpayData.customerId || null,
      razorpaySubscriptionId: razorpayData.subscriptionId || null,
      premiumActivatedAt: new Date(),
      updatedAt: new Date()
    };

    memoryUsers.set(userId, basicUser);
    return basicUser;
  }

  // Daily weight operations
  async saveDailyWeight(weight: InsertDailyWeight): Promise<DailyWeight> {
    const dailyWeight: DailyWeight = {
      id: Date.now(),
      sessionId: weight.sessionId,
      weight: weight.weight,
      date: weight.date,
      createdAt: new Date(),
    };

    const key = `${weight.sessionId}_${weight.date}`;
    memoryDailyWeights.set(key, dailyWeight);
    return dailyWeight;
  }

  async getDailyWeight(sessionId: string, date: string): Promise<DailyWeight | undefined> {
    const key = `${sessionId}_${date}`;
    return memoryDailyWeights.get(key);
  }

  async getDailyWeights(sessionId: string): Promise<DailyWeight[]> {
    const weights: DailyWeight[] = [];
    for (const [key, weight] of memoryDailyWeights.entries()) {
      if (key.startsWith(`${sessionId}_`)) {
        weights.push(weight);
      }
    }
    return weights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.memoryUsers.values());
  }
}

export const fallbackStorage = new FallbackStorage();
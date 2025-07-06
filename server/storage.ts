import { 
  Food, 
  MealItem, 
  UserProfile, 
  Exercise, 
  DailySummary,
  DailyWeight,
  User,
  UsageTracking,
  SubscriptionPlan,
  Influencer,
  InfluencerReferral,
  InsertFood, 
  InsertMealItem, 
  InsertUserProfile, 
  InsertExercise,
  InsertDailySummary,
  InsertDailyWeight,
  UpsertUser,
  InsertUsageTracking,
  InsertInfluencer,
  InsertInfluencerReferral,
  MealItemWithFood 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { 
  foods, 
  mealItems, 
  userProfiles, 
  exercises, 
  dailySummaries,
  dailyWeights,
  users,
  usageTracking,
  subscriptionPlans,
  influencers,
  influencerReferrals
} from "@shared/schema";

export interface IStorage {
  // Food operations
  getAllFoods(): Promise<Food[]>;
  searchFoods(query: string): Promise<Food[]>;
  getFoodById(id: number): Promise<Food | undefined>;
  
  // Meal operations
  getMealItems(sessionId: string, date?: string): Promise<MealItemWithFood[]>;
  addMealItem(mealItem: InsertMealItem): Promise<MealItem>;
  removeMealItem(id: number): Promise<boolean>;
  clearMeal(sessionId: string, date?: string): Promise<boolean>;
  
  // Profile operations
  saveUserProfile(profile: InsertUserProfile & { bmr: number; tdee: number; targetCalories: number }): Promise<UserProfile>;
  getUserProfile(sessionId: string): Promise<UserProfile | undefined>;
  
  // Exercise operations
  addExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercises(sessionId: string, date?: string): Promise<Exercise[]>;
  removeExercise(id: number): Promise<boolean>;
  clearExercises(sessionId: string): Promise<boolean>;
  
  // AI food operations
  storeAiFood(food: Food): Promise<void>;
  
  // Daily summary operations
  saveDailySummary(summary: InsertDailySummary): Promise<DailySummary>;
  getDailySummary(sessionId: string, date: string): Promise<DailySummary | undefined>;
  getDailySummaries(sessionId: string): Promise<DailySummary[]>;
  
  // Daily weight operations
  saveDailyWeight(weight: InsertDailyWeight): Promise<DailyWeight>;
  getDailyWeight(sessionId: string, date: string): Promise<DailyWeight | undefined>;
  getDailyWeights(sessionId: string): Promise<DailyWeight[]>;
  
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  
  // Usage tracking operations
  trackUsage(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search"): Promise<void>;
  getUserUsage(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search", date: string): Promise<number>;
  getLifetimeUserUsage(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search"): Promise<number>;
  canUserPerformAction(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search"): Promise<boolean>;
  activatePremiumSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User>;
  activateBasicSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User>;
  
  // Nudge system operations
  getAllUsers(): Promise<User[]>;
  
  // Subscription plan operations
  getSubscriptionPlan(planName: string): Promise<SubscriptionPlan | undefined>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  
  // Influencer referral operations
  createInfluencer(influencer: InsertInfluencer): Promise<Influencer>;
  getAllInfluencers(): Promise<Influencer[]>;
  getInfluencerByReferralCode(referralCode: string): Promise<Influencer | undefined>;
  updateInfluencerStats(influencerId: number, subscriptionAmount: number): Promise<void>;
  createInfluencerReferral(referral: InsertInfluencerReferral): Promise<InfluencerReferral>;
  getInfluencerReferrals(influencerId: number): Promise<InfluencerReferral[]>;
}

export class DatabaseStorage implements IStorage {
  // Food operations
  async getAllFoods(): Promise<Food[]> {
    return await db.select().from(foods);
  }

  async searchFoods(query: string): Promise<Food[]> {
    if (!query.trim()) {
      return await db.select().from(foods).limit(20);
    }
    
    const searchResults = await db
      .select()
      .from(foods)
      .where(ilike(foods.name, `%${query}%`))
      .limit(20);
    
    return searchResults;
  }

  async getFoodById(id: number): Promise<Food | undefined> {
    const [food] = await db.select().from(foods).where(eq(foods.id, id));
    return food || undefined;
  }

  // Meal operations
  async getMealItems(sessionId: string, date?: string): Promise<MealItemWithFood[]> {
    const conditions = [eq(mealItems.sessionId, sessionId)];
    
    if (date) {
      conditions.push(eq(mealItems.date, date));
    }
    
    const items = await db
      .select({
        id: mealItems.id,
        sessionId: mealItems.sessionId,
        foodId: mealItems.foodId,
        quantity: mealItems.quantity,
        unit: mealItems.unit,
        date: mealItems.date,
        createdAt: mealItems.createdAt,
        // Frontend-calculated nutrition values (exact from search)
        frontendCalories: mealItems.frontendCalories,
        frontendProtein: mealItems.frontendProtein,
        frontendCarbs: mealItems.frontendCarbs,
        frontendFat: mealItems.frontendFat,
        frontendTotalGrams: mealItems.frontendTotalGrams,
        food: {
          id: foods.id,
          name: foods.name,
          calories: foods.calories,
          protein: foods.protein,
          carbs: foods.carbs,
          fat: foods.fat,
          portionSize: foods.portionSize,
          category: foods.category,
          defaultUnit: foods.defaultUnit,
          smartPortionGrams: foods.smartPortionGrams,
          smartCalories: foods.smartCalories,
          smartProtein: foods.smartProtein,
          smartCarbs: foods.smartCarbs,
          smartFat: foods.smartFat,
          aiConfidence: foods.aiConfidence,
        }
      })
      .from(mealItems)
      .innerJoin(foods, eq(mealItems.foodId, foods.id))
      .where(and(...conditions));
    
    return items;
  }

  async addMealItem(mealItem: InsertMealItem): Promise<MealItem> {
    const [newItem] = await db
      .insert(mealItems)
      .values(mealItem)
      .returning();
    return newItem;
  }

  async removeMealItem(id: number): Promise<boolean> {
    const result = await db.delete(mealItems).where(eq(mealItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearMeal(sessionId: string, date?: string): Promise<boolean> {
    try {
      console.log(`DatabaseStorage: Clearing meal items for session ${sessionId} on date ${date || 'all dates'}`);
      
      if (date) {
        // Clear only items for specific date
        await db.delete(mealItems).where(
          and(
            eq(mealItems.sessionId, sessionId),
            eq(mealItems.date, date)
          )
        );
      } else {
        // Clear all meals for session
        await db.delete(mealItems).where(eq(mealItems.sessionId, sessionId));
      }
      
      return true;
    } catch (error) {
      console.error("Error clearing meal in DatabaseStorage:", error);
      return false;
    }
  }

  // Profile operations
  async saveUserProfile(profile: InsertUserProfile & { bmr: number; tdee: number; targetCalories: number }): Promise<UserProfile> {
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.sessionId, profile.sessionId));

    if (existingProfile) {
      const [updatedProfile] = await db
        .update(userProfiles)
        .set(profile)
        .where(eq(userProfiles.sessionId, profile.sessionId))
        .returning();
      return updatedProfile;
    } else {
      const [newProfile] = await db
        .insert(userProfiles)
        .values(profile)
        .returning();
      return newProfile;
    }
  }

  async getUserProfile(sessionId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.sessionId, sessionId));
    return profile || undefined;
  }

  // Exercise operations
  async addExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db
      .insert(exercises)
      .values(exercise)
      .returning();
    return newExercise;
  }

  async getExercises(sessionId: string, date?: string): Promise<Exercise[]> {
    const conditions = [eq(exercises.sessionId, sessionId)];
    
    if (date) {
      conditions.push(eq(exercises.date, date));
    }
    
    return await db
      .select()
      .from(exercises)
      .where(and(...conditions))
      .orderBy(desc(exercises.completedAt));
  }

  async removeExercise(id: number): Promise<boolean> {
    const result = await db
      .delete(exercises)
      .where(eq(exercises.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearExercises(sessionId: string): Promise<boolean> {
    await db
      .delete(exercises)
      .where(eq(exercises.sessionId, sessionId));
    return true;
  }

  // AI food operations
  async storeAiFood(food: Food): Promise<void> {
    await db.insert(foods).values({
      id: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      portionSize: food.portionSize,
      category: food.category,
      defaultUnit: food.defaultUnit,
      smartPortionGrams: food.smartPortionGrams,
      smartCalories: food.smartCalories,
      smartProtein: food.smartProtein,
      smartCarbs: food.smartCarbs,
      smartFat: food.smartFat,
      aiConfidence: food.aiConfidence
    }).onConflictDoUpdate({
      target: foods.id,
      set: {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        portionSize: food.portionSize,
        category: food.category,
        defaultUnit: food.defaultUnit,
        smartPortionGrams: food.smartPortionGrams,
        smartCalories: food.smartCalories,
        smartProtein: food.smartProtein,
        smartCarbs: food.smartCarbs,
        smartFat: food.smartFat,
        aiConfidence: food.aiConfidence
      }
    });
  }

  // Daily summary operations
  async saveDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
    const [existingSummary] = await db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.sessionId, summary.sessionId),
          eq(dailySummaries.date, summary.date)
        )
      );

    if (existingSummary) {
      const [updatedSummary] = await db
        .update(dailySummaries)
        .set(summary)
        .where(eq(dailySummaries.id, existingSummary.id))
        .returning();
      return updatedSummary;
    } else {
      const [newSummary] = await db
        .insert(dailySummaries)
        .values(summary)
        .returning();
      return newSummary;
    }
  }

  async getDailySummary(sessionId: string, date: string): Promise<DailySummary | undefined> {
    const [summary] = await db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.sessionId, sessionId),
          eq(dailySummaries.date, date)
        )
      );
    return summary || undefined;
  }

  async getDailySummaries(sessionId: string): Promise<DailySummary[]> {
    return await db
      .select()
      .from(dailySummaries)
      .where(eq(dailySummaries.sessionId, sessionId))
      .orderBy(desc(dailySummaries.date));
  }

  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Usage tracking operations
  async trackUsage(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search"): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if usage record exists for today
    const [existingUsage] = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.actionType, actionType),
          eq(usageTracking.date, today)
        )
      );

    if (existingUsage) {
      // Increment existing usage
      await db
        .update(usageTracking)
        .set({ count: (existingUsage.count || 0) + 1 })
        .where(eq(usageTracking.id, existingUsage.id));
    } else {
      // Create new usage record
      await db.insert(usageTracking).values({
        userId,
        actionType,
        date: today,
        count: 1,
      });
    }

    // Daily tracking only - no need to update total counters since limits reset daily
  }

  async getUserUsage(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search", date: string): Promise<number> {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.actionType, actionType),
          eq(usageTracking.date, date)
        )
      );
    return usage?.count || 0;
  }

  async getLifetimeUserUsage(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search"): Promise<number> {
    const usageRecords = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.actionType, actionType)
        )
      );
    
    // Sum up all the count values
    const total = usageRecords.reduce((sum, record) => sum + (record.count || 0), 0);
    return total;
  }

  async canUserPerformAction(userId: string, actionType: "meal_add" | "photo_analyze" | "food_search"): Promise<boolean> {
    // Admin testing user has unlimited access
    if (userId === "admin_testing_user") {
      return true;
    }
    
    const user = await this.getUser(userId);
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    
    // Premium users have highest daily limits
    if (user.subscriptionStatus === 'premium') {
      const usage = await this.getUserUsage(userId, actionType, today);
      const premiumLimits = {
        meal_add: 999999,   // Unlimited meal adds for premium
        photo_analyze: 10,  // 10 photo analysis per day for premium
        food_search: 200    // 200 food searches per day for premium
      };
      
      return usage < premiumLimits[actionType];
    }

    // Basic users have moderate daily limits
    if (user.subscriptionStatus === 'basic') {
      const usage = await this.getUserUsage(userId, actionType, today);
      const basicLimits = {
        meal_add: 999999,   // Unlimited meal adds for basic
        photo_analyze: 5,   // 5 photo analysis per day for basic
        food_search: 100    // 100 food searches per day for basic
      };
      
      return usage < basicLimits[actionType];
    }

    // For free users, check lifetime limits (not daily)
    const lifetimeUsage = await this.getLifetimeUserUsage(userId, actionType);
    const freeLimits = {
      meal_add: 999999,   // Unlimited meal adds for free users
      photo_analyze: 5,   // 5 photo analysis lifetime for free users
      food_search: 20     // 20 food searches lifetime forever for free users
    };

    return lifetimeUsage < freeLimits[actionType];
  }

  async activatePremiumSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User> {
    // Set subscription to end 1 month from now
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionStatus: 'premium',
        subscriptionEndsAt: subscriptionEndDate,
        razorpayCustomerId: razorpayData.customerId,
        razorpaySubscriptionId: razorpayData.subscriptionId,
        premiumActivatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async activateBasicSubscription(userId: string, razorpayData: { customerId?: string; subscriptionId?: string }): Promise<User> {
    // Set subscription to end 1 month from now
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionStatus: 'basic',
        subscriptionEndsAt: subscriptionEndDate,
        razorpayCustomerId: razorpayData.customerId,
        razorpaySubscriptionId: razorpayData.subscriptionId,
        premiumActivatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error: unknown) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }

  // Daily weight operations
  async saveDailyWeight(weight: InsertDailyWeight): Promise<DailyWeight> {
    try {
      const [savedWeight] = await db
        .insert(dailyWeights)
        .values(weight)
        .onConflictDoUpdate({
          target: [dailyWeights.sessionId, dailyWeights.date],
          set: { weight: weight.weight }
        })
        .returning();
      return savedWeight;
    } catch (error) {
      console.error("Error in saveDailyWeight:", error);
      throw error;
    }
  }

  async getDailyWeight(sessionId: string, date: string): Promise<DailyWeight | undefined> {
    const [weight] = await db
      .select()
      .from(dailyWeights)
      .where(and(eq(dailyWeights.sessionId, sessionId), eq(dailyWeights.date, date)));
    return weight;
  }

  async getDailyWeights(sessionId: string): Promise<DailyWeight[]> {
    return await db
      .select()
      .from(dailyWeights)
      .where(eq(dailyWeights.sessionId, sessionId))
      .orderBy(desc(dailyWeights.date));
  }

  // Subscription plan operations
  async getSubscriptionPlan(planName: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.planName, planName), eq(subscriptionPlans.isActive, true)));
    return plan;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.priceInPaise);
  }

  // Influencer referral operations
  async createInfluencer(influencer: InsertInfluencer): Promise<Influencer> {
    // Generate a unique 5-letter referral code
    const referralCode = this.generateReferralCode();
    
    const [newInfluencer] = await db
      .insert(influencers)
      .values({
        ...influencer,
        referralCode,
      })
      .returning();
    
    return newInfluencer;
  }

  async getAllInfluencers(): Promise<Influencer[]> {
    return await db
      .select()
      .from(influencers)
      .where(eq(influencers.isActive, true))
      .orderBy(desc(influencers.totalRevenue));
  }

  async getInfluencerByReferralCode(referralCode: string): Promise<Influencer | undefined> {
    const [influencer] = await db
      .select()
      .from(influencers)
      .where(and(
        eq(influencers.referralCode, referralCode.toUpperCase()),
        eq(influencers.isActive, true)
      ));
    
    return influencer || undefined;
  }

  async updateInfluencerStats(influencerId: number, subscriptionAmount: number): Promise<void> {
    const commissionAmount = Math.floor(subscriptionAmount * 0.1); // 10% commission

    // Get current stats first
    const [currentInfluencer] = await db
      .select()
      .from(influencers)
      .where(eq(influencers.id, influencerId));

    if (currentInfluencer) {
      await db
        .update(influencers)
        .set({
          totalSubscriptions: currentInfluencer.totalSubscriptions + 1,
          totalRevenue: currentInfluencer.totalRevenue + subscriptionAmount,
          totalCommission: currentInfluencer.totalCommission + commissionAmount,
          updatedAt: new Date(),
        })
        .where(eq(influencers.id, influencerId));
    }
  }

  async createInfluencerReferral(referral: InsertInfluencerReferral): Promise<InfluencerReferral> {
    const [newReferral] = await db
      .insert(influencerReferrals)
      .values(referral)
      .returning();
    
    return newReferral;
  }

  async getInfluencerReferrals(influencerId: number): Promise<InfluencerReferral[]> {
    return await db
      .select()
      .from(influencerReferrals)
      .where(eq(influencerReferrals.influencerId, influencerId))
      .orderBy(desc(influencerReferrals.createdAt));
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Import fallback storage for development without Firebase
import { fallbackStorage } from './fallbackStorage';

// Use database storage for production, fallback storage for development/testing
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  try {
    // Test database connection
    if (process.env.DATABASE_URL || process.env.AWS_DATABASE_URL) {
      const dbStorage = new DatabaseStorage();
      
      // Test the connection with a simple query
      try {
        await dbStorage.getAllFoods(); // This will test the database connection
        console.log("Using DatabaseStorage with PostgreSQL");
        return dbStorage;
      } catch (dbError) {
        console.warn("Database connection test failed:", dbError);
        throw dbError;
      }
    } else {
      throw new Error("No database URL provided");
    }
  } catch (error: unknown) {
    console.warn("Database connection failed, using FallbackStorage:", (error as Error).message);
    return fallbackStorage;
  }
}

// Initialize storage synchronously with fallback as default
storage = fallbackStorage;

// Attempt to upgrade to database storage asynchronously
initializeStorage().then((initializedStorage) => {
  storage = initializedStorage;
}).catch((error) => {
  console.warn("Failed to initialize database storage, continuing with fallback:", error);
});

export { storage };
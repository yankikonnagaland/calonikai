import { pgTable, text, serial, integer, real, timestamp, varchar, jsonb, index, boolean, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  portionSize: text("portion_size").notNull(),
  category: text("category").notNull(),
  defaultUnit: text("default_unit").notNull(),
  // AI-detected smart portion data (optional)
  smartPortionGrams: real("smart_portion_grams"), // AI-detected portion weight
  smartCalories: real("smart_calories"), // AI-detected calories for that portion
  smartProtein: real("smart_protein"), // AI-detected protein for that portion
  smartCarbs: real("smart_carbs"), // AI-detected carbs for that portion
  smartFat: real("smart_fat"), // AI-detected fat for that portion
  aiConfidence: real("ai_confidence"), // Confidence level (0-100)
});

export const mealItems = pgTable("meal_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  foodId: integer("food_id").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // Frontend-calculated nutrition values (exact values shown in search)
  frontendCalories: real("frontend_calories"),
  frontendProtein: real("frontend_protein"),
  frontendCarbs: real("frontend_carbs"),
  frontendFat: real("frontend_fat"),
  frontendTotalGrams: real("frontend_total_grams"),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  height: real("height").notNull(),
  weight: real("weight").notNull(),
  bodyType: text("body_type").notNull(),
  activityLevel: text("activity_level").notNull(),
  weightGoal: text("weight_goal").notNull(),
  weightTarget: real("weight_target"), // How many kgs to lose/gain
  goalAchieved: boolean("goal_achieved").default(false), // Track if goal is achieved
  goalAchievedAt: timestamp("goal_achieved_at"), // When goal was achieved
  bmr: real("bmr"),
  tdee: real("tdee"),
  targetCalories: real("target_calories"),
  targetProtein: real("target_protein"), // Daily protein goal in grams
  dailyProteinTarget: real("daily_protein_target"), // Alternative field name for protein goals
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  type: text("type").notNull(),
  exerciseName: text("exercise_name"),
  duration: integer("duration").notNull(), // in minutes
  caloriesBurned: real("calories_burned").notNull(),
  date: text("date"), // YYYY-MM-DD format for date-specific tracking
  // Additional fields for running, walking, cycling
  distanceKm: real("distance_km"), // Distance in kilometers
  durationMin: integer("duration_min"), // Duration in minutes (separate from general duration)
  intensityLevel: text("intensity_level"), // 'Sub 1' | 'Sub 2' | 'Sub 3'
  heartRate: integer("heart_rate"), // Optional heart rate
  terrain: text("terrain"), // Optional terrain description
  usesSmartwatch: boolean("uses_smartwatch").default(false), // Whether smartwatch was used
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalCalories: real("total_calories").notNull(),
  totalProtein: real("total_protein").notNull(),
  totalCarbs: real("total_carbs").notNull(),
  totalFat: real("total_fat").notNull(),
  caloriesBurned: real("calories_burned").notNull(),
  netCalories: real("net_calories").notNull(),
  mealData: text("meal_data").notNull(), // JSON string of meal items
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily weight tracking table
export const dailyWeights = pgTable("daily_weights", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  weight: real("weight").notNull(), // in kg, using real for decimal support
  date: text("date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionDateUnique: unique("daily_weights_session_date_unique").on(table.sessionId, table.date),
}));

// Subscription pricing configuration table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planName: text("plan_name").notNull().unique(), // 'basic', 'premium'
  displayName: text("display_name").notNull(), // 'Basic Plan', 'Premium Plan'
  priceInPaise: integer("price_in_paise").notNull(), // Amount in paise (₹99 = 9900 paise)
  currency: text("currency").notNull().default("INR"),
  billingPeriod: text("billing_period").notNull().default("monthly"), // 'monthly', 'yearly'
  photoLimit: integer("photo_limit").notNull(), // Daily photo scan limit
  mealLimit: integer("meal_limit").notNull(), // Daily meal search limit
  exerciseEnabled: boolean("exercise_enabled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hourly calorie-burning activities table
export const hourlyActivities = pgTable("hourly_activities", {
  id: serial("id").primaryKey(),
  activityNumber: integer("activity_number").notNull().unique(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  category: text("category").notNull().default("general"), // general, kungfu, cleaning, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Influencer referral tracking tables
export const influencers = pgTable("influencers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  referralCode: text("referral_code").notNull().unique(), // 5-letter code
  totalSubscriptions: integer("total_subscriptions").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // In paise
  totalCommission: integer("total_commission").notNull().default(0), // In paise (10% of revenue)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const influencerReferrals = pgTable("influencer_referrals", {
  id: serial("id").primaryKey(),
  influencerId: integer("influencer_id").notNull(),
  userId: text("user_id").notNull(), // User who subscribed
  subscriptionPlan: text("subscription_plan").notNull(), // 'basic' or 'premium'
  subscriptionAmount: integer("subscription_amount").notNull(), // In paise
  commissionAmount: integer("commission_amount").notNull(), // 10% of subscription amount
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiUsageStats = pgTable("ai_usage_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // null for anonymous users
  sessionId: text("session_id").notNull(),
  aiProvider: text("ai_provider").notNull(), // "gemini", "openai", etc.
  aiModel: text("ai_model").notNull(), // "gemini-1.5-flash", "gpt-4", etc.
  requestType: text("request_type").notNull(), // "food_search", "image_analysis", "smart_units", etc.
  query: text("query"), // search query or request description
  inputTokens: integer("input_tokens"), // estimated input tokens
  outputTokens: integer("output_tokens"), // estimated output tokens
  estimatedCost: real("estimated_cost"), // estimated cost in rupees
  responseTime: integer("response_time"), // response time in milliseconds
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  date: text("date").notNull(), // YYYY-MM-DD format for easy filtering
});

export const insertFoodSchema = createInsertSchema(foods).omit({
  id: true,
});

export const insertMealItemSchema = createInsertSchema(mealItems).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  bmr: true,
  tdee: true,
  targetCalories: true,
  createdAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({
  id: true,
  createdAt: true,
});

export const insertDailyWeightSchema = createInsertSchema(dailyWeights).omit({
  id: true,
  createdAt: true,
});

export const insertHourlyActivitySchema = createInsertSchema(hourlyActivities).omit({
  id: true,
  createdAt: true,
});

export const insertInfluencerSchema = createInsertSchema(influencers).omit({
  id: true,
  totalSubscriptions: true,
  totalRevenue: true,
  totalCommission: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInfluencerReferralSchema = createInsertSchema(influencerReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertAiUsageStatsSchema = createInsertSchema(aiUsageStats).omit({
  id: true,
  createdAt: true,
});

export type Food = typeof foods.$inferSelect;
export type MealItem = typeof mealItems.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type DailySummary = typeof dailySummaries.$inferSelect;
export type HourlyActivity = typeof hourlyActivities.$inferSelect;
export type Influencer = typeof influencers.$inferSelect;
export type InfluencerReferral = typeof influencerReferrals.$inferSelect;

export type InsertFood = z.infer<typeof insertFoodSchema>;
export type InsertMealItem = z.infer<typeof insertMealItemSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type InsertDailyWeight = z.infer<typeof insertDailyWeightSchema>;
export type InsertHourlyActivity = z.infer<typeof insertHourlyActivitySchema>;
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;
export type InsertInfluencerReferral = z.infer<typeof insertInfluencerReferralSchema>;
export type InsertAiUsageStats = z.infer<typeof insertAiUsageStatsSchema>;

// Daily weight types
export type DailyWeight = typeof dailyWeights.$inferSelect;
export type AiUsageStats = typeof aiUsageStats.$inferSelect;

// Additional types for API responses
export const searchFoodsSchema = z.object({
  query: z.string().min(1).optional(),
}).transform(data => ({
  query: data.query || ""
}));

export const calculateProfileSchema = insertUserProfileSchema;

export const mealItemWithFoodSchema = z.object({
  id: z.number(),
  sessionId: z.string(),
  foodId: z.number(),
  quantity: z.number(),
  unit: z.string(),
  createdAt: z.date().nullable(),
  food: z.object({
    id: z.number(),
    name: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    portionSize: z.string(),
    category: z.string(),
    defaultUnit: z.string(),
    // AI-detected smart portion data (optional)
    smartPortionGrams: z.number().nullable().optional(),
    smartCalories: z.number().nullable().optional(),
    smartProtein: z.number().nullable().optional(),
    smartCarbs: z.number().nullable().optional(),
    smartFat: z.number().nullable().optional(),
    aiConfidence: z.number().nullable().optional(),
  }),
});

export type MealItemWithFood = z.infer<typeof mealItemWithFoodSchema>;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication and subscriptions
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For email/password authentication
  googleId: varchar("google_id"), // For Google OAuth authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  razorpayCustomerId: varchar("razorpay_customer_id"),
  razorpaySubscriptionId: varchar("razorpay_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, basic, premium, cancelled, past_due
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  premiumActivatedAt: timestamp("premium_activated_at"),
  freeCreditsUsed: integer("free_credits_used").default(0), // Track free meals used
  freePhotosUsed: integer("free_photos_used").default(0), // Track free photos used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking table
export const usageTracking = pgTable("usage_tracking", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  actionType: varchar("action_type").notNull(), // "meal_add", "photo_analyze"
  date: date("date").notNull(),
  count: integer("count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  usageTracking: many(usageTracking),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

// Subscription plan schemas and types
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

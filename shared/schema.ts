import { pgTable, text, serial, integer, real, timestamp, varchar, jsonb, index, boolean, date } from "drizzle-orm/pg-core";
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
});

export const mealItems = pgTable("meal_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  foodId: integer("food_id").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

export type Food = typeof foods.$inferSelect;
export type MealItem = typeof mealItems.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type DailySummary = typeof dailySummaries.$inferSelect;

export type InsertFood = z.infer<typeof insertFoodSchema>;
export type InsertMealItem = z.infer<typeof insertMealItemSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type InsertDailyWeight = z.infer<typeof insertDailyWeightSchema>;

// Daily weight types
export type DailyWeight = typeof dailyWeights.$inferSelect;

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
  subscriptionStatus: varchar("subscription_status").default("free"), // free, premium, cancelled, past_due
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

// User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

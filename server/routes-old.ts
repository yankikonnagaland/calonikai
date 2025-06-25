import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertMealItemSchema, 
  insertUserProfileSchema, 
  insertExerciseSchema,
  insertDailySummarySchema,
  searchFoodsSchema,
  calculateProfileSchema
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import crypto from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Razorpay configuration (optional)
import Razorpay from 'razorpay';

let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// AI-powered food search function with hash-based IDs
async function searchFoodWithAI(query: string) {
  try {
    // First check if we already have this food in the database
    const normalizedQuery = query.toLowerCase().trim();
    const existingFoods = await storage.searchFoods(normalizedQuery);
    if (existingFoods.length > 0) {
      return existingFoods[0];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert. Provide nutritional information for foods. Return only valid JSON with these exact fields: name, calories, protein, carbs, fat, portionSize, category, defaultUnit. Calories should be per 100g unless specified otherwise. Use reasonable estimates for Indian/Asian foods."
        },
        {
          role: "user",
          content: `Get nutritional information for: ${query}. Return JSON format with name, calories (per 100g), protein (g), carbs (g), fat (g), portionSize (like "100g" or "1 piece"), category (like "Main Course", "Snacks", etc), defaultUnit (like "medium", "pieces", "grams").`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (result.name && result.calories && typeof result.calories === 'number') {
      // Generate deterministic ID based on food name hash
      const foodName = result.name.toLowerCase().trim();
      const hash = crypto.createHash('sha256').update(foodName).digest('hex');
      const hashInt = parseInt(hash.substring(0, 8), 16);
      const aiId = 2100000000 + (hashInt % 47000000);
      
      const food = {
        id: aiId,
        name: result.name,
        calories: Math.round(result.calories),
        protein: Math.round((result.protein || 0) * 10) / 10,
        carbs: Math.round((result.carbs || 0) * 10) / 10,
        fat: Math.round((result.fat || 0) * 10) / 10,
        portionSize: result.portionSize || "100g",
        category: result.category || "Unknown",
        defaultUnit: result.defaultUnit || "medium"
      };

      // Check if this exact food (by ID) already exists to prevent duplicates
      const existingFood = await storage.getFoodById(aiId);
      if (!existingFood) {
        await storage.storeAiFood(food);
      }
      
      return food;
    }
    
    return null;
  } catch (error) {
    console.error("OpenAI food search error:", error);
    return null;
  }
}

// AI-powered smart unit selection
async function getSmartUnitSelection(foodName: string, category: string = ""): Promise<{ unit: string; unitOptions: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a food measurement expert. Based on the food name and category, suggest the most appropriate default unit and provide relevant unit options. Return JSON format only."
        },
        {
          role: "user",
          content: `Food: "${foodName}", Category: "${category}". Return JSON with: { "unit": "best_default_unit", "unitOptions": ["unit1", "unit2", "unit3", "unit4", "unit5"] }. Use these guidelines:
          - Rice, curry, dal, pasta, noodles: "medium portion" as default, options: ["small portion", "medium portion", "large portion", "grams", "cups"]
          - Beverages (tea, coffee, juice, milk): "cups" as default, options: ["cups", "ml", "glasses", "small cup", "large cup"]
          - Countable items (banana, apple, samosa, bread, egg): "pieces" as default, options: ["pieces", "small", "medium", "large", "grams"]
          - Powder/spices: "grams" as default, options: ["grams", "teaspoons", "tablespoons", "pinch", "cups"]
          - Snacks (chips, cookies): "grams" as default, options: ["grams", "pieces", "small pack", "medium pack", "large pack"]`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 150
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      unit: result.unit || "medium",
      unitOptions: result.unitOptions || ["pieces", "grams", "small", "medium", "large"]
    };
  } catch (error) {
    console.error("Smart unit selection error:", error);
    // Fallback logic
    const lowerFood = foodName.toLowerCase();
    const lowerCategory = category.toLowerCase();
    
    if (lowerFood.includes('tea') || lowerFood.includes('coffee') || lowerFood.includes('juice') || lowerCategory.includes('beverage')) {
      return { unit: "cup", unitOptions: ["cup", "ml", "glass", "small cup", "large cup"] };
    } else if (lowerFood.includes('rice') || lowerFood.includes('curry') || lowerFood.includes('dal') || lowerFood.includes('pasta')) {
      return { unit: "medium portion", unitOptions: ["small portion", "medium portion", "large portion", "grams", "cups"] };
    } else if (lowerFood.includes('banana') || lowerFood.includes('apple') || lowerFood.includes('samosa') || lowerFood.includes('bread') || lowerFood.includes('egg')) {
      return { unit: "pieces", unitOptions: ["pieces", "small", "medium", "large", "grams"] };
    } else if (lowerCategory.includes('snack')) {
      return { unit: "grams", unitOptions: ["grams", "pieces", "small pack", "medium pack", "large pack"] };
    }
    
    return { unit: "medium", unitOptions: ["pieces", "grams", "small", "medium", "large"] };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  // Authentication route supporting both Supabase and device fingerprint
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId: string | undefined;
      let userEmail: string | undefined;
      let userName: string | undefined;

      // Check Supabase token first
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          // For Supabase JWT verification, we'll validate the format
          const token = authHeader.substring(7);
          if (token && token.includes('.')) {
            // Basic JWT structure validation
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub && payload.email) {
              userId = payload.sub;
              userEmail = payload.email;
              userName = payload.user_metadata?.full_name || payload.email?.split('@')[0];
              console.log("Supabase user authenticated:", userEmail);
            }
          }
        } catch (error) {
          console.log("Supabase token verification failed, using device auth");
        }
      }

      // Fallback to device fingerprint authentication
      if (!userId) {
        const deviceAuth = req.headers['x-device-auth'] as string;
        if (deviceAuth && deviceAuth.startsWith('device_') && /^device_[a-zA-Z0-9]+$/.test(deviceAuth)) {
          userId = deviceAuth;
          userEmail = `${deviceAuth}@device.local`;
          userName = 'Device User';
          console.log("Device user authenticated:", deviceAuth);
        }
      }

      if (!userId) {
        return res.status(401).json({ message: "No valid authentication found" });
      }

      // Get or create user
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: userEmail || null,
          firstName: userName || null,
          lastName: null,
          profileImageUrl: null,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Usage tracking middleware
  const checkUsageLimit = (actionType: "meal_add" | "photo_analyze") => {
    return async (req: any, res: any, next: any) => {
      // Get user authentication information using the same logic as other routes
      let userId: string | null = null;
      let userEmail: string | null = null;
      let userName: string | null = null;

      // Check Supabase token first
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          if (token && token.includes('.')) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub && payload.email) {
              userId = payload.sub;
              userEmail = payload.email;
              userName = payload.user_metadata?.full_name || payload.email?.split('@')[0];
            }
          }
        } catch (error) {
          // Token verification failed, will try device auth
        }
      }

      // Fallback to device fingerprint authentication
      if (!userId) {
        const deviceAuth = req.headers['x-device-auth'] as string;
        if (deviceAuth && deviceAuth.startsWith('device_') && /^device_[a-zA-Z0-9]+$/.test(deviceAuth)) {
          userId = deviceAuth;
          userEmail = `${deviceAuth}@device.local`;
          userName = 'Device User';
        }
      }

      // Skip usage tracking if not authenticated (allow session-based usage)
      if (!userId) {
        return next();
      }

      // Skip usage limits for photo analysis during testing phase
      if (actionType === "photo_analyze") {
        return next();
      }

      const canPerform = await storage.canUserPerformAction(userId, actionType);
      
      if (!canPerform) {
        const user = await storage.getUser(userId);
        const isPhotoAction = actionType === "photo_analyze";
        const usedCount = isPhotoAction ? (user?.freePhotosUsed || 0) : (user?.freeCreditsUsed || 0);
        
        return res.status(402).json({ 
          message: "Usage limit exceeded", 
          error: "USAGE_LIMIT_EXCEEDED",
          usedCount,
          limit: 1,
          actionType,
          subscriptionRequired: true
        });
      }

      // Track usage if authenticated
      await storage.trackUsage(userId, actionType);
      next();
    };
  };

  // Food routes
  app.get("/api/foods", async (req, res) => {
    try {
      const foods = await storage.getAllFoods();
      res.json(foods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch foods" });
    }
  });

  app.get("/api/foods/search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      console.log("Search query received:", query);
      if (query.length < 1) {
        return res.json([]);
      }
      
      // First search in local database
      const foods = await storage.searchFoods(query);
      console.log("Search results count:", foods.length);
      
      // If no results found and query is reasonable, try OpenAI search
      if (foods.length === 0 && query.length >= 3 && process.env.OPENAI_API_KEY) {
        try {
          const aiFood = await searchFoodWithAI(query);
          if (aiFood) {
            // Store AI-generated food so it can be retrieved later
            await storage.storeAiFood(aiFood);
            return res.json([aiFood]);
          }
        } catch (aiError) {
          console.error("AI food search failed:", aiError);
          // Silently fall back to empty results without showing error to user
          return res.json([]);
        }
      }

      // If still no results after trying AI search, return helpful message for unknown foods
      if (foods.length === 0 && query.length >= 3) {
        return res.json([{
          id: -1,
          name: `${query} (Not Found)`,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          portionSize: "100g",
          category: "Unknown Food", 
          defaultUnit: "medium",
          isNotFound: true,
          error: "Food not found in our database. Try searching for similar items from our extensive collection."
        }]);
      }
      
      res.json(foods);
    } catch (error) {
      res.status(500).json({ message: "Failed to search foods" });
    }
  });

  // Smart unit suggestion endpoint
  app.post("/api/smart-unit", async (req, res) => {
    try {
      const { foodName, category } = req.body;
      
      if (!foodName) {
        return res.status(400).json({ message: "Food name is required" });
      }
      
      const smartUnits = await getSmartUnitSelection(foodName, category || "");
      res.json(smartUnits);
    } catch (error) {
      console.error("Smart unit selection error:", error);
      res.status(500).json({ message: "Failed to get smart unit suggestions" });
    }
  });

  // Intelligent food analysis API
  app.post("/api/intelligent-food-analysis", async (req, res) => {
    try {
      const { foodName, category, calories, portionSize } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        // Return local intelligent suggestion if OpenAI not available
        return res.json(getLocalIntelligentAnalysis(foodName, category, calories));
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert. Analyze food items and provide intelligent serving suggestions with reasoning. Focus on realistic portion sizes and health considerations."
          },
          {
            role: "user",
            content: `Analyze this food item and suggest the most appropriate serving:

Food: ${foodName}
Category: ${category}
Calories: ${calories} per ${portionSize}

Provide response in JSON format:
{
  "unit": "recommended unit (cup, piece, portion, etc.)",
  "quantity": number (typical serving amount),
  "unitOptions": ["array", "of", "relevant", "units"],
  "reasoning": "brief explanation for the recommendation"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("AI food analysis error:", error);
      res.json(getLocalIntelligentAnalysis(req.body.foodName, req.body.category, req.body.calories));
    }
  });

  // AI Exercise Analysis API
  app.post("/api/ai-exercise-analysis", async (req, res) => {
    try {
      const { exerciseDescription } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.json(getLocalExerciseAnalysis(exerciseDescription));
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a fitness expert. Analyze exercise descriptions and provide accurate calorie burn estimates with intensity considerations. Focus on realistic assessments based on exercise physiology."
          },
          {
            role: "user",
            content: `Analyze this exercise description and provide detailed information:

Exercise: "${exerciseDescription}"

Provide response in JSON format:
{
  "exerciseName": "standardized exercise name",
  "baseCaloriesPerMin": number (calories per minute at moderate intensity),
  "suggestedDuration": number (recommended duration in minutes),
  "intensityMultipliers": {
    "low": number (multiplier for low intensity),
    "moderate": number (multiplier for moderate intensity), 
    "high": number (multiplier for high intensity)
  },
  "reasoning": "brief explanation of calorie burn and benefits",
  "category": "exercise category (Cardio, Strength, Flexibility, etc.)"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("AI exercise analysis error:", error);
      res.json(getLocalExerciseAnalysis(req.body.exerciseDescription));
    }
  });

  // Local exercise analysis fallback
  function getLocalExerciseAnalysis(exerciseDescription: string) {
    const desc = exerciseDescription.toLowerCase();
    
    if (desc.includes("run") || desc.includes("jog")) {
      return {
        exerciseName: "Running",
        baseCaloriesPerMin: 10,
        suggestedDuration: 30,
        intensityMultipliers: { low: 0.7, moderate: 1.0, high: 1.4 },
        reasoning: "Running is a high-intensity cardiovascular exercise that efficiently burns calories",
        category: "Cardio"
      };
    }
    
    if (desc.includes("walk")) {
      return {
        exerciseName: "Walking",
        baseCaloriesPerMin: 5,
        suggestedDuration: 45,
        intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.3 },
        reasoning: "Walking is a sustainable, low-impact exercise suitable for all fitness levels",
        category: "Cardio"
      };
    }
    
    if (desc.includes("weight") || desc.includes("strength") || desc.includes("lift")) {
      return {
        exerciseName: "Weight Training",
        baseCaloriesPerMin: 6,
        suggestedDuration: 45,
        intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.4 },
        reasoning: "Strength training builds muscle while providing moderate calorie burn and afterburn effect",
        category: "Strength"
      };
    }
    
    if (desc.includes("swim")) {
      return {
        exerciseName: "Swimming",
        baseCaloriesPerMin: 11,
        suggestedDuration: 30,
        intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.5 },
        reasoning: "Swimming provides full-body, low-impact exercise with high calorie burn",
        category: "Full Body"
      };
    }
    
    if (desc.includes("yoga") || desc.includes("stretch")) {
      return {
        exerciseName: "Yoga/Stretching",
        baseCaloriesPerMin: 3,
        suggestedDuration: 60,
        intensityMultipliers: { low: 0.9, moderate: 1.0, high: 1.2 },
        reasoning: "Yoga improves flexibility and mindfulness with moderate calorie burn",
        category: "Flexibility"
      };
    }
    
    if (desc.includes("bike") || desc.includes("cycle")) {
      return {
        exerciseName: "Cycling",
        baseCaloriesPerMin: 8,
        suggestedDuration: 40,
        intensityMultipliers: { low: 0.7, moderate: 1.0, high: 1.4 },
        reasoning: "Cycling is an efficient low-impact cardio exercise",
        category: "Cardio"
      };
    }
    
    return {
      exerciseName: exerciseDescription,
      baseCaloriesPerMin: 6,
      suggestedDuration: 30,
      intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.3 },
      reasoning: "Moderate-intensity exercise with balanced calorie burn",
      category: "General"
    };
  }

  // Local intelligent analysis fallback function
  function getLocalIntelligentAnalysis(foodName: string, category: string, calories: number) {
    const name = foodName.toLowerCase();
    const cat = category?.toLowerCase() || "";
    
    // Beverages analysis
    if (cat.includes("beverage") || name.includes("tea") || name.includes("coffee") || 
        name.includes("juice") || name.includes("milk") || name.includes("latte")) {
      return {
        unit: "cup",
        quantity: 1,
        unitOptions: ["cup", "ml", "glass"],
        reasoning: "Beverages are typically consumed in cup servings for optimal hydration"
      };
    }
    
    // Rice and curry dishes
    if (name.includes("rice") || name.includes("curry") || name.includes("dal") || 
        name.includes("biryani") || name.includes("pulao")) {
      return {
        unit: "medium portion",
        quantity: 1,
        unitOptions: ["small portion", "medium portion", "large portion", "cup"],
        reasoning: "Rice and curry dishes are best served in balanced portion sizes"
      };
    }
    
    // Countable items
    if (name.includes("apple") || name.includes("banana") || name.includes("bread") || 
        name.includes("roti") || name.includes("dosa") || name.includes("samosa") || name.includes("egg")) {
      return {
        unit: "piece",
        quantity: 1,
        unitOptions: ["piece", "small", "medium", "large"],
        reasoning: "Whole food items are naturally portioned as individual pieces"
      };
    }
    
    // Snacks with calorie consideration
    if (cat.includes("snack") || name.includes("biscuit") || name.includes("cookie") || name.includes("chips")) {
      const smartQuantity = calories > 200 ? 1 : 2;
      return {
        unit: "piece",
        quantity: smartQuantity,
        unitOptions: ["piece", "gram", "small pack"],
        reasoning: calories > 200 ? "High-calorie snack, single serving recommended for portion control" : "Light snack, multiple pieces typical for satisfaction"
      };
    }
    
    // Default analysis
    return {
      unit: "serving",
      quantity: 1,
      unitOptions: ["serving", "gram", "piece"],
      reasoning: "Standard serving size recommended based on nutrition guidelines"
    };
  }

  app.get("/api/foods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid food ID" });
      }
      
      const food = await storage.getFoodById(id);
      if (!food) {
        return res.status(404).json({ message: "Food not found" });
      }
      
      res.json(food);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food" });
    }
  });

  // AI food storage route
  app.post("/api/ai-food", async (req, res) => {
    try {
      const foodData = req.body;
      await storage.storeAiFood(foodData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error storing AI food:", error);
      res.status(500).json({ message: "Failed to store AI food" });
    }
  });

  // Meal routes
  app.get("/api/meal/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const mealItems = await storage.getMealItems(sessionId);
      res.json(mealItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal items" });
    }
  });

  app.post("/api/meal", async (req, res) => {
    try {
      console.log("Received meal item data:", JSON.stringify(req.body, null, 2));
      const mealItem = insertMealItemSchema.parse(req.body);
      
      // For AI-generated foods (with IDs >= 2100000000), skip database validation
      // They will be handled as temporary foods in memory
      if (mealItem.foodId >= 2100000000) {
        // This is an AI-generated food ID
        const newMealItem = await storage.addMealItem(mealItem);
        return res.status(201).json(newMealItem);
      }
      
      // Validate that regular foods exist in database
      const food = await storage.getFoodById(mealItem.foodId);
      if (!food) {
        return res.status(400).json({ message: "Food not found" });
      }
      
      const newMealItem = await storage.addMealItem(mealItem);
      res.status(201).json(newMealItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid meal item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add meal item" });
      }
    }
  });

  app.delete("/api/meal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meal item ID" });
      }
      
      const success = await storage.removeMealItem(id);
      if (!success) {
        return res.status(404).json({ message: "Meal item not found" });
      }
      
      res.json({ message: "Meal item removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove meal item" });
    }
  });

  app.delete("/api/meal/clear/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearMeal(sessionId);
      res.json({ message: "Meal cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear meal" });
    }
  });

  // Profile routes
  app.post("/api/profile/calculate", async (req, res) => {
    try {
      const profileData = calculateProfileSchema.parse(req.body);
      
      // Calculate BMR using Mifflin-St Jeor equation
      let bmr: number;
      if (profileData.gender === 'male') {
        bmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age + 5;
      } else {
        bmr = 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age - 161;
      }
      
      // Calculate TDEE based on activity level
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9
      };
      
      const tdee = bmr * activityMultipliers[profileData.activityLevel as keyof typeof activityMultipliers];
      
      // Calculate target calories based on weight goal
      let targetCalories: number;
      switch (profileData.weightGoal) {
        case 'lose':
          targetCalories = tdee - 500; // 500 calorie deficit for 1lb/week loss
          break;
        case 'gain':
          targetCalories = tdee + 500; // 500 calorie surplus for 1lb/week gain
          break;
        default:
          targetCalories = tdee; // maintenance
      }
      
      const profile = await storage.saveUserProfile({
        ...profileData,
        bmr,
        tdee,
        targetCalories
      });
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to calculate profile" });
      }
    }
  });

  app.get("/api/profile/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const profile = await storage.getUserProfile(sessionId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Exercise routes
  app.post("/api/exercise", async (req, res) => {
    try {
      const exerciseData = insertExerciseSchema.parse(req.body);
      
      const exercise = await storage.addExercise(exerciseData);
      
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid exercise data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to log exercise" });
      }
    }
  });

  app.get("/api/exercise/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const exercises = await storage.getExercises(sessionId);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  // Exercise removal routes
  app.delete("/api/exercise/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exercise ID" });
      }
      
      const success = await storage.removeExercise(id);
      if (!success) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove exercise" });
    }
  });

  app.delete("/api/exercise/clear/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearExercises(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear exercises" });
    }
  });

  // AI-powered motivational messages endpoint
  app.get("/api/motivational-message/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Get user profile for calorie targets
      const profile = await storage.getUserProfile(sessionId);
      if (!profile) {
        return res.json({
          message: "Start tracking your meals and set up your profile to get personalized motivation!",
          type: "neutral"
        });
      }

      // Get today's meal items and exercises
      const mealItems = await storage.getMealItems(sessionId);
      const exercises = await storage.getExercises(sessionId);
      
      const caloriesConsumed = mealItems.reduce((total, item) => {
        function getMultiplier(unit: string, food: any) {
          const unitMultipliers: { [key: string]: number } = {
            'slice': food.name?.toLowerCase().includes('cake') ? 0.8 : 
                    food.name?.toLowerCase().includes('pizza') ? 0.3 : 0.6,
            'piece': food.name?.toLowerCase().includes('small') ? 0.5 : 0.8,
            'small portion': 0.7,
            'medium portion': 1.0,
            'large portion': 1.5,
            'cup': 0.8,
            'tablespoon': 0.1,
            'teaspoon': 0.03,
            'gram': 0.01,
            'small': 0.7,
            'medium': 1.0,
            'large': 1.3
          };
          return unitMultipliers[unit.toLowerCase()] || 1;
        }
        
        const multiplier = getMultiplier(item.unit, item.food);
        return total + (item.food.calories * item.quantity * multiplier);
      }, 0);
      
      const caloriesBurned = exercises.reduce((total, exercise) => total + exercise.caloriesBurned, 0);
      const netCalories = caloriesConsumed - caloriesBurned;
      const targetCalories = profile.targetCalories || 2000;
      const calorieBalance = netCalories - targetCalories;

      // Generate AI-powered motivational message
      if (!process.env.OPENAI_API_KEY) {
        return res.json(getLocalMotivationalMessage(netCalories, targetCalories, calorieBalance, profile.weightGoal));
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a supportive fitness and nutrition coach. Provide encouraging, personalized motivational messages based on the user's calorie tracking progress. Keep messages positive, actionable, and under 100 words."
          },
          {
            role: "user",
            content: `Generate a motivational message for a user with these stats:
            
Net Calories: ${Math.round(netCalories)}
Target Calories: ${Math.round(targetCalories)}
Calorie Balance: ${Math.round(calorieBalance)} (${calorieBalance > 0 ? 'over' : 'under'} target)
Weight Goal: ${profile.weightGoal}
Meals Tracked: ${mealItems.length}
Exercises Completed: ${exercises.length}

Provide response in JSON format:
{
  "message": "encouraging and personalized message",
  "type": "success|warning|info|neutral",
  "tip": "optional actionable tip"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("AI motivational message error:", error);
      const { sessionId } = req.params;
      const profile = await storage.getUserProfile(sessionId);
      const mealItems = await storage.getMealItems(sessionId);
      const exercises = await storage.getExercises(sessionId);
      
      const caloriesConsumed = mealItems.reduce((total, item) => total + (item.food.calories * item.quantity), 0);
      const caloriesBurned = exercises.reduce((total, exercise) => total + exercise.caloriesBurned, 0);
      const netCalories = caloriesConsumed - caloriesBurned;
      const targetCalories = profile?.targetCalories || 2000;
      const calorieBalance = netCalories - targetCalories;
      
      res.json(getLocalMotivationalMessage(netCalories, targetCalories, calorieBalance, profile?.weightGoal || "maintain"));
    }
  });

  // Local motivational message fallback
  function getLocalMotivationalMessage(netCalories: number, targetCalories: number, calorieBalance: number, weightGoal: string) {
    const absBalance = Math.abs(calorieBalance);
    
    if (weightGoal === "lose" && calorieBalance < -100) {
      return {
        message: "Excellent work! You're in a healthy calorie deficit for weight loss. Your dedication is paying off!",
        type: "success",
        tip: "Keep up the great work with portion control and exercise!"
      };
    } else if (weightGoal === "gain" && calorieBalance > 100) {
      return {
        message: "Great job hitting your calorie surplus for healthy weight gain! Your consistency is key to reaching your goals.",
        type: "success",
        tip: "Focus on nutrient-dense foods to maximize your gains!"
      };
    } else if (weightGoal === "maintain" && absBalance < 100) {
      return {
        message: "Perfect balance! You're maintaining your weight beautifully with consistent tracking and smart choices.",
        type: "success",
        tip: "Your maintenance approach is spot on - keep it up!"
      };
    } else if (calorieBalance > 300) {
      return {
        message: "You're significantly over your target today. Consider adding some extra activity or lighter dinner options.",
        type: "warning",
        tip: "A 20-minute walk can help balance those extra calories!"
      };
    } else if (calorieBalance < -300) {
      return {
        message: "You're quite a bit under your calorie target. Make sure you're fueling your body adequately!",
        type: "info",
        tip: "Add a healthy snack like nuts or fruit to meet your energy needs."
      };
    } else {
      return {
        message: "You're doing great with your nutrition tracking! Small adjustments can help you reach your goals faster.",
        type: "neutral",
        tip: "Stay consistent with logging - you're building healthy habits!"
      };
    }
  }

  // AI-powered healthy meal suggestions endpoint
  app.get("/api/alternatives", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      
      // Get current meal items
      const mealItems = await storage.getMealItems(sessionId);
      
      if (mealItems.length === 0) {
        return res.json({
          alternatives: [],
          tip: "Add some foods to your meal to get personalized healthy suggestions!"
        });
      }
      
      // Generate AI-powered suggestions based on current meal
      const suggestions = await generateAIMealSuggestions(mealItems);
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating meal suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // AI-powered meal suggestions function
  async function generateAIMealSuggestions(mealItems: any[]) {
    if (!process.env.OPENAI_API_KEY) {
      return {
        alternatives: [],
        tip: "AI suggestions are currently unavailable. Try adding more vegetables or lean proteins to your meal!"
      };
    }

    try {
      // Prepare meal composition for AI analysis
      const mealComposition = mealItems.map(item => ({
        name: item.food.name,
        calories: item.food.calories * item.quantity,
        protein: item.food.protein * item.quantity,
        carbs: item.food.carbs * item.quantity,
        fat: item.food.fat * item.quantity,
        category: item.food.category,
        quantity: item.quantity,
        unit: item.unit
      }));

      const totalCalories = mealComposition.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = mealComposition.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = mealComposition.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = mealComposition.reduce((sum, item) => sum + item.fat, 0);

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a certified nutritionist and health expert. Analyze meal compositions and provide personalized healthy suggestions. Focus on balanced nutrition, portion control, and practical recommendations. Return only valid JSON."
          },
          {
            role: "user",
            content: `Analyze this meal and provide healthy suggestions:

Current Meal:
${mealComposition.map(item => `- ${item.name}: ${item.calories} cal, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fat}g fat`).join('\n')}

Total: ${totalCalories} calories, ${totalProtein}g protein, ${totalCarbs}g carbs, ${totalFat}g fat

Provide suggestions in this JSON format:
{
  "alternatives": [
    {
      "name": "specific food suggestion",
      "calorieDiff": number (positive if adding calories, negative if reducing),
      "reason": "brief explanation why this improves the meal"
    }
  ],
  "tip": "one personalized nutrition tip based on the meal composition"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        alternatives: result.alternatives || [],
        tip: result.tip || "Consider adding more vegetables and lean proteins to balance your meal."
      };
    } catch (error) {
      console.error("AI meal suggestions error:", error);
      return {
        alternatives: [
          { name: "Add leafy greens", calorieDiff: 20, reason: "Boost fiber and micronutrients" },
          { name: "Include lean protein", calorieDiff: 100, reason: "Improve satiety and muscle support" },
          { name: "Choose whole grains", calorieDiff: 0, reason: "Better sustained energy release" }
        ],
        tip: "Aim for a balanced plate with vegetables, lean protein, and complex carbohydrates."
      };
    }
  }

  // Daily summary routes
  app.post("/api/daily-summary", async (req, res) => {
    try {
      const summaryData = insertDailySummarySchema.parse(req.body);
      const summary = await storage.saveDailySummary(summaryData);
      res.status(201).json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid summary data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save daily summary" });
      }
    }
  });

  app.get("/api/daily-summary/:sessionId/:date", async (req, res) => {
    try {
      const { sessionId, date } = req.params;
      const summary = await storage.getDailySummary(sessionId, date);
      
      if (!summary) {
        return res.status(404).json({ message: "Daily summary not found" });
      }
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily summary" });
    }
  });

  app.get("/api/daily-summaries/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const summaries = await storage.getDailySummaries(sessionId);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily summaries" });
    }
  });

  // Food image analysis route
  app.post("/api/analyze-food-image", checkUsageLimit("photo_analyze"), async (req, res) => {
    try {
      const { image, sessionId } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: "Image data required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert and food recognition AI. Analyze food images and provide detailed nutritional information. Return only valid JSON with foods array and suggestions array. Each food should have: name, calories (per estimated serving), protein, carbs, fat, confidence (0-100), estimatedQuantity. Provide realistic estimates for Indian/Asian foods."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image. Identify all visible foods and estimate their nutritional content per serving. Return JSON format: { \"foods\": [{ \"name\": string, \"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number, \"confidence\": number, \"estimatedQuantity\": string }], \"suggestions\": [string] }"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.foods || !Array.isArray(result.foods)) {
        return res.status(400).json({ message: "Invalid analysis result" });
      }

      // Ensure all foods have valid numeric values
      const validatedFoods = result.foods.map((food: any) => ({
        name: food.name || "Unknown Food",
        calories: Math.round(Number(food.calories) || 0),
        protein: Math.round((Number(food.protein) || 0) * 10) / 10,
        carbs: Math.round((Number(food.carbs) || 0) * 10) / 10,
        fat: Math.round((Number(food.fat) || 0) * 10) / 10,
        confidence: Math.min(100, Math.max(0, Math.round(Number(food.confidence) || 70))),
        estimatedQuantity: food.estimatedQuantity || "1 serving"
      }));

      res.json({
        foods: validatedFoods,
        suggestions: result.suggestions || []
      });
    } catch (error) {
      console.error("Food image analysis error:", error);
      res.status(500).json({ message: "Failed to analyze food image" });
    }
  });

  // Razorpay order creation route
  app.post("/api/create-razorpay-order", verifyFirebaseToken, async (req: any, res) => {
    try {
      if (!razorpay) {
        return res.status(400).json({ error: "Payment gateway not configured. Please contact support." });
      }

      const { amount, currency } = req.body;
      const userId = req.user.uid;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const options = {
        amount: amount, // amount in paise
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: userId,
          subscription: 'premium_yearly'
        }
      };

      const order = await razorpay.orders.create(options);
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  });

  // Razorpay payment verification route
  app.post("/api/verify-razorpay-payment", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const userId = req.user.uid;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        // Payment is verified, activate premium subscription
        await storage.updateUserStripeInfo(userId, razorpay_payment_id, razorpay_payment_id);
        
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ error: "Invalid payment signature" });
      }
    } catch (error) {
      console.error("Razorpay payment verification error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Test endpoint for daily credits system
  app.get('/api/test-daily-credits', async (req, res) => {
    try {
      const testUserId = "test_user_123";
      const today = new Date().toISOString().split('T')[0];
      
      // Test meal tracking limit
      const mealUsage = await storage.getUserUsage(testUserId, "meal_add", today);
      const canAddMeal = await storage.canUserPerformAction(testUserId, "meal_add");
      
      // Test photo analysis limit
      const photoUsage = await storage.getUserUsage(testUserId, "photo_analyze", today);
      const canAnalyzePhoto = await storage.canUserPerformAction(testUserId, "photo_analyze");
      
      // Simulate tracking usage
      if (canAddMeal) {
        await storage.trackUsage(testUserId, "meal_add");
      }
      if (canAnalyzePhoto) {
        await storage.trackUsage(testUserId, "photo_analyze");
      }
      
      // Get updated usage
      const newMealUsage = await storage.getUserUsage(testUserId, "meal_add", today);
      const newPhotoUsage = await storage.getUserUsage(testUserId, "photo_analyze", today);
      const newCanAddMeal = await storage.canUserPerformAction(testUserId, "meal_add");
      const newCanAnalyzePhoto = await storage.canUserPerformAction(testUserId, "photo_analyze");
      
      res.json({
        testDate: today,
        before: {
          mealUsage,
          photoUsage,
          canAddMeal,
          canAnalyzePhoto
        },
        after: {
          mealUsage: newMealUsage,
          photoUsage: newPhotoUsage,
          canAddMeal: newCanAddMeal,
          canAnalyzePhoto: newCanAnalyzePhoto
        },
        dailyLimits: {
          mealLimit: 1,
          photoLimit: 1
        }
      });
    } catch (error: any) {
      console.error('Daily credit test error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get subscription status (Razorpay only)
  app.get('/api/subscription-status', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get today's usage for both action types
      const today = new Date().toISOString().split('T')[0];
      const todayMealUsage = await storage.getUserUsage(userId, "meal_add", today);
      const todayPhotoUsage = await storage.getUserUsage(userId, "photo_analyze", today);

      res.json({
        subscriptionStatus: user.subscriptionStatus,
        freeCreditsUsed: todayMealUsage,
        freePhotosUsed: todayPhotoUsage,
        freeCreditsLimit: 1,
        freePhotosLimit: 1,
        dailyReset: true, // Indicates that limits reset daily
        razorpayPaymentId: user.stripeCustomerId, // Reusing field for Razorpay payment ID
      });
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Populate Indian foods from CSV
  app.post("/api/populate-indian-foods", async (req, res) => {
    try {
      const indianFoods = [
        { name: "Roti", calories: 100, protein: 2.5, carbs: 18, fat: 3, portionSize: "1 piece", category: "Indian Bread", defaultUnit: "pieces" },
        { name: "Plain Rice", calories: 200, protein: 4, carbs: 45, fat: 0.5, portionSize: "1 cup", category: "Rice", defaultUnit: "cups" },
        { name: "Dal", calories: 180, protein: 12, carbs: 24, fat: 6, portionSize: "1 cup", category: "Lentils", defaultUnit: "cups" },
        { name: "Chicken Curry", calories: 250, protein: 20, carbs: 8, fat: 15, portionSize: "1 serving", category: "Curry", defaultUnit: "servings" },
        { name: "Paneer Tikka", calories: 300, protein: 18, carbs: 5, fat: 22, portionSize: "100g", category: "Paneer", defaultUnit: "grams" },
        { name: "Samosa", calories: 130, protein: 3, carbs: 17, fat: 6, portionSize: "1 piece", category: "Snacks", defaultUnit: "pieces" },
        { name: "Chole", calories: 260, protein: 14, carbs: 32, fat: 10, portionSize: "1 cup", category: "Curry", defaultUnit: "cups" },
        { name: "Poha", calories: 180, protein: 4, carbs: 30, fat: 5, portionSize: "1 plate", category: "Breakfast", defaultUnit: "plates" },
        { name: "Idli", calories: 40, protein: 2, carbs: 8, fat: 0.5, portionSize: "1 piece", category: "South Indian", defaultUnit: "pieces" },
        { name: "Dosa", calories: 170, protein: 4, carbs: 30, fat: 4, portionSize: "1 piece", category: "South Indian", defaultUnit: "pieces" },
        { name: "Upma", calories: 210, protein: 5, carbs: 28, fat: 9, portionSize: "1 cup", category: "Breakfast", defaultUnit: "cups" },
        { name: "Pav Bhaji", calories: 400, protein: 8, carbs: 40, fat: 20, portionSize: "1 plate", category: "Street Food", defaultUnit: "plates" },
        { name: "Pani Puri", calories: 300, protein: 4, carbs: 40, fat: 12, portionSize: "6 pieces", category: "Street Food", defaultUnit: "pieces" },
        { name: "Rajma", calories: 240, protein: 14, carbs: 30, fat: 8, portionSize: "1 cup", category: "Curry", defaultUnit: "cups" },
        { name: "Aloo Paratha", calories: 290, protein: 6, carbs: 35, fat: 14, portionSize: "1 piece", category: "Indian Bread", defaultUnit: "pieces" },
        { name: "Fish Curry", calories: 220, protein: 22, carbs: 5, fat: 12, portionSize: "1 serving", category: "Curry", defaultUnit: "servings" },
        { name: "Curd", calories: 90, protein: 8, carbs: 6, fat: 4, portionSize: "1 cup", category: "Dairy", defaultUnit: "cups" },
        { name: "Vegetable Pulao", calories: 210, protein: 4, carbs: 38, fat: 6, portionSize: "1 cup", category: "Rice", defaultUnit: "cups" },
        { name: "Khichdi", calories: 200, protein: 7, carbs: 30, fat: 5, portionSize: "1 cup", category: "Rice", defaultUnit: "cups" },
        { name: "Biryani", calories: 450, protein: 20, carbs: 50, fat: 18, portionSize: "1 plate", category: "Rice", defaultUnit: "plates" },
        { name: "Vada Pav", calories: 150, protein: 3, carbs: 25, fat: 5, portionSize: "1 piece", category: "Street Food", defaultUnit: "pieces" },
        { name: "Butter Chicken", calories: 320, protein: 25, carbs: 10, fat: 20, portionSize: "1 serving", category: "Curry", defaultUnit: "servings" },
        { name: "Tandoori Chicken", calories: 240, protein: 28, carbs: 5, fat: 12, portionSize: "1 serving", category: "Tandoori", defaultUnit: "servings" },
        { name: "Matar Paneer", calories: 280, protein: 14, carbs: 18, fat: 18, portionSize: "1 serving", category: "Curry", defaultUnit: "servings" },
        { name: "Aloo Gobi", calories: 150, protein: 5, carbs: 25, fat: 5, portionSize: "1 serving", category: "Curry", defaultUnit: "servings" },
        { name: "Palak Paneer", calories: 250, protein: 15, carbs: 12, fat: 18, portionSize: "1 serving", category: "Curry", defaultUnit: "servings" },
        { name: "Naan", calories: 260, protein: 9, carbs: 45, fat: 5, portionSize: "1 piece", category: "Indian Bread", defaultUnit: "pieces" },
        { name: "Butter Naan", calories: 320, protein: 9, carbs: 45, fat: 12, portionSize: "1 piece", category: "Indian Bread", defaultUnit: "pieces" },
        { name: "Tandoori Roti", calories: 120, protein: 4, carbs: 25, fat: 1, portionSize: "1 piece", category: "Indian Bread", defaultUnit: "pieces" },
        { name: "Jeera Rice", calories: 220, protein: 4, carbs: 45, fat: 3, portionSize: "1 cup", category: "Rice", defaultUnit: "cups" },
        { name: "Vegetable Biryani", calories: 350, protein: 8, carbs: 60, fat: 10, portionSize: "1 plate", category: "Rice", defaultUnit: "plates" },
        { name: "Lassi", calories: 150, protein: 6, carbs: 20, fat: 4, portionSize: "1 glass", category: "Beverages", defaultUnit: "glasses" },
        { name: "Kheer", calories: 200, protein: 6, carbs: 35, fat: 5, portionSize: "1 bowl", category: "Desserts", defaultUnit: "bowls" },
        { name: "Gulab Jamun", calories: 150, protein: 3, carbs: 25, fat: 5, portionSize: "1 piece", category: "Desserts", defaultUnit: "pieces" },
        { name: "Medu Vada", calories: 120, protein: 4, carbs: 15, fat: 5, portionSize: "1 piece", category: "South Indian", defaultUnit: "pieces" },
        { name: "Rava Dosa", calories: 200, protein: 5, carbs: 35, fat: 5, portionSize: "1 piece", category: "South Indian", defaultUnit: "pieces" },
        { name: "Coconut Chutney", calories: 80, protein: 2, carbs: 5, fat: 7, portionSize: "2 tbsp", category: "Condiments", defaultUnit: "tablespoons" },
        { name: "Sambar", calories: 100, protein: 6, carbs: 15, fat: 3, portionSize: "1 cup", category: "South Indian", defaultUnit: "cups" },
        { name: "Lemon Rice", calories: 180, protein: 3, carbs: 35, fat: 4, portionSize: "1 cup", category: "Rice", defaultUnit: "cups" },
        { name: "Tamarind Rice", calories: 200, protein: 4, carbs: 40, fat: 4, portionSize: "1 cup", category: "Rice", defaultUnit: "cups" }
      ];

      let addedCount = 0;
      for (const food of indianFoods) {
        try {
          // Generate a unique ID for each food
          const foodId = Math.floor(Math.random() * 1000000) + 100000;
          await storage.storeAiFood({ ...food, id: foodId });
          addedCount++;
        } catch (error) {
          console.error(`Error adding ${food.name}:`, error);
        }
      }

      res.json({ message: `Successfully added ${addedCount} Indian foods to database` });
    } catch (error) {
      console.error("Error populating Indian foods:", error);
      res.status(500).json({ message: "Failed to populate Indian foods" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateHealthyAlternatives(food: any) {
  const alternativeMap: Record<string, { name: string; calorieDiff: number; reason: string }[]> = {
    'Grains': [
      { name: 'Brown Rice', calorieDiff: -19, reason: 'Higher fiber content' },
      { name: 'Quinoa', calorieDiff: -10, reason: 'Complete protein source' }
    ],
    'Breads': [
      { name: 'Whole Wheat Roti', calorieDiff: -50, reason: 'Less oil, more fiber' },
      { name: 'Multigrain Bread', calorieDiff: -30, reason: 'Better nutritional profile' }
    ],
    'Snacks': [
      { name: 'Roasted Chickpeas', calorieDiff: -100, reason: 'High protein, less oil' },
      { name: 'Fruit Salad', calorieDiff: -150, reason: 'Natural sugars, vitamins' }
    ],
    'Sweets': [
      { name: 'Fresh Fruit', calorieDiff: -250, reason: 'Natural sweetness, fiber' },
      { name: 'Date and Nut Balls', calorieDiff: -150, reason: 'Natural sugars, healthy fats' }
    ]
  };

  return alternativeMap[food.category] || [
    { name: 'Steamed Version', calorieDiff: -80, reason: 'Less oil used' },
    { name: 'Grilled Alternative', calorieDiff: -60, reason: 'Healthier cooking method' }
  ];
}

function generateNutritionTip(): string {
  const tips = [
    "💡 Almonds and walnuts are great sources of healthy fats and protein. Add them to your meals for sustained energy!",
    "🌱 Include green leafy vegetables in your diet for iron, folate, and antioxidants.",
    "🥑 Avocados provide healthy monounsaturated fats that support heart health.",
    "🐟 Fatty fish like salmon are rich in omega-3 fatty acids for brain health.",
    "🫘 Legumes and beans are excellent plant-based protein sources with fiber.",
    "🥬 Colorful vegetables provide different vitamins and minerals - eat the rainbow!",
    "🌰 Seeds like chia and flax are packed with omega-3s and fiber.",
    "🍓 Berries are antioxidant powerhouses that support immune function.",
    "🥛 Greek yogurt provides probiotics for gut health and high-quality protein.",
    "🥕 Orange vegetables like carrots and sweet potatoes are rich in beta-carotene."
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}

import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { fallbackStorage } from "./fallbackStorage";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertMealItemSchema,
  insertUserProfileSchema,
  insertExerciseSchema,
  insertDailySummarySchema,
  insertDailyWeightSchema,
  searchFoodsSchema,
  calculateProfileSchema,
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import crypto from "crypto";
import { checkWeightGoalAchievement, markGoalAsAchieved } from "./weightGoalChecker";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Razorpay configuration (optional)
import Razorpay from "razorpay";

let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Optimized AI-powered food search with intelligent categorization
async function searchFoodWithAI(query: string) {
  try {
    const normalizedQuery = query.toLowerCase().trim();

    // Check database first for exact and partial matches
    let existingFoods = await storage.searchFoods(normalizedQuery);
    if (existingFoods.length > 0) {
      return existingFoods[0];
    }

    // Try partial matches for common variations
    const partialResults = await storage.searchFoods(
      normalizedQuery.split(" ")[0],
    );
    if (partialResults.length > 0) {
      const bestMatch = partialResults.find(
        (f) =>
          f.name.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(f.name.toLowerCase()),
      );
      if (bestMatch) return bestMatch;
    }

    if (!process.env.OPENAI_API_KEY) {
      return createFallbackFood(query);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition expert specializing in Indian, Asian, and international cuisines. Provide accurate nutritional information. Return only valid JSON with exact fields: name, calories, protein, carbs, fat, portionSize, category, defaultUnit. Focus on realistic values for authentic dishes.",
        },
        {
          role: "user",
          content: `Analyze this food item and provide comprehensive nutrition data: "${query}"

Return JSON format:
{
  "name": "proper food name",
  "calories": number (per 100g),
  "protein": number (grams),
  "carbs": number (grams), 
  "fat": number (grams),
  "portionSize": "typical serving size description",
  "category": "food category (Main Course/Snacks/Beverages/etc)",
  "defaultUnit": "best measurement unit (pieces/cups/portions/grams)"
}

Consider regional variations and authentic preparation methods.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const foodData = JSON.parse(response.choices[0].message.content || "{}");

    // Generate consistent hash-based ID
    const foodHash = crypto
      .createHash("md5")
      .update(normalizedQuery)
      .digest("hex")
      .substring(0, 8);

    const food = {
      id: parseInt(foodHash, 16),
      name: foodData.name || query,
      calories:
        Math.round(Number(foodData.calories)) || getDefaultCalories(query),
      protein:
        Math.round(
          (Number(foodData.protein) || getDefaultProtein(query)) * 10,
        ) / 10,
      carbs:
        Math.round((Number(foodData.carbs) || getDefaultCarbs(query)) * 10) /
        10,
      fat: Math.round((Number(foodData.fat) || getDefaultFat(query)) * 10) / 10,
      portionSize: foodData.portionSize || "100g",
      category: foodData.category || categorizeFood(query),
      defaultUnit:
        foodData.defaultUnit || getSmartDefaultUnit(query, foodData.category),
    };

    // Store for future searches
    await storage.storeAiFood(food);
    console.log(`AI food created: ${food.name} (${food.calories} cal)`);

    return food;
  } catch (error) {
    console.error("AI food search error:", error);
    return createFallbackFood(query);
  }
}

// Enhanced fallback food creation with intelligent defaults
function createFallbackFood(query: string) {
  const foodHash = crypto
    .createHash("md5")
    .update(query.toLowerCase().trim())
    .digest("hex")
    .substring(0, 6);
  return {
    id: parseInt(foodHash, 16) % 2000000000, // Keep within PostgreSQL integer limit
    name: query,
    calories: getDefaultCalories(query),
    protein: getDefaultProtein(query),
    carbs: getDefaultCarbs(query),
    fat: getDefaultFat(query),
    portionSize: "100g",
    category: categorizeFood(query),
    defaultUnit: getSmartDefaultUnit(query, categorizeFood(query)),
  };
}

// Intelligent categorization based on food name patterns
function categorizeFood(foodName: string): string {
  const name = foodName.toLowerCase();
  if (
    name.includes("rice") ||
    name.includes("biryani") ||
    name.includes("curry") ||
    name.includes("dal")
  )
    return "Main Course";
  if (name.includes("roti") || name.includes("naan") || name.includes("bread"))
    return "Bread";
  if (
    name.includes("tea") ||
    name.includes("coffee") ||
    name.includes("juice") ||
    name.includes("lassi")
  )
    return "Beverages";
  if (
    name.includes("samosa") ||
    name.includes("pakora") ||
    name.includes("biscuit") ||
    name.includes("chips")
  )
    return "Snacks";
  if (
    name.includes("chicken") ||
    name.includes("mutton") ||
    name.includes("fish") ||
    name.includes("egg")
  )
    return "Protein";
  if (
    name.includes("sweet") ||
    name.includes("dessert") ||
    name.includes("cake") ||
    name.includes("ice cream")
  )
    return "Desserts";
  return "Main Course";
}

// Smart default unit selection
function getSmartDefaultUnit(foodName: string, category: string): string {
  const name = foodName.toLowerCase();
  if (name.includes("tea") || name.includes("coffee") || name.includes("juice"))
    return "cup";
  if (
    name.includes("apple") ||
    name.includes("banana") ||
    name.includes("egg") ||
    name.includes("samosa")
  )
    return "piece";
  if (name.includes("rice") || name.includes("curry") || name.includes("dal"))
    return "medium portion";
  if (name.includes("bread") || name.includes("roti") || name.includes("naan"))
    return "piece";
  if (category === "Beverages") return "cup";
  if (category === "Snacks") return "piece";
  return "grams";
}

// Intelligent calorie defaults based on food type
function getDefaultCalories(foodName: string): number {
  const name = foodName.toLowerCase();
  if (name.includes("rice") || name.includes("biryani")) return 130;
  if (name.includes("curry") || name.includes("dal")) return 120;
  if (name.includes("chicken")) return 165;
  if (name.includes("fish")) return 140;
  if (name.includes("vegetable")) return 25;
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana")
  )
    return 50;
  if (name.includes("bread") || name.includes("roti")) return 250;
  if (name.includes("sweet") || name.includes("dessert")) return 300;
  return 100;
}

function getDefaultProtein(foodName: string): number {
  const name = foodName.toLowerCase();
  if (name.includes("chicken") || name.includes("fish") || name.includes("egg"))
    return 20;
  if (name.includes("dal") || name.includes("lentil")) return 8;
  if (name.includes("paneer")) return 18;
  if (name.includes("vegetable") || name.includes("fruit")) return 2;
  return 5;
}

function getDefaultCarbs(foodName: string): number {
  const name = foodName.toLowerCase();
  if (name.includes("rice") || name.includes("bread") || name.includes("roti"))
    return 25;
  if (name.includes("fruit") || name.includes("sweet")) return 15;
  if (name.includes("vegetable")) return 5;
  return 15;
}

function getDefaultFat(foodName: string): number {
  const name = foodName.toLowerCase();
  if (
    name.includes("fried") ||
    name.includes("pakora") ||
    name.includes("samosa")
  )
    return 15;
  if (name.includes("curry") || name.includes("chicken")) return 8;
  if (name.includes("sweet") || name.includes("dessert")) return 12;
  if (name.includes("vegetable") || name.includes("fruit")) return 0.5;
  return 3;
}

// Direct AI search without database dependency
async function searchFoodDirectly(query: string) {
  const normalizedQuery = query.toLowerCase().trim();

  if (!process.env.OPENAI_API_KEY) {
    return createFallbackFood(query);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition expert. Provide accurate nutritional information for foods. Return only valid JSON with exact fields: name, calories, protein, carbs, fat, portionSize, category, defaultUnit. Focus on realistic values.",
        },
        {
          role: "user",
          content: `Provide nutrition data for: "${query}". Return JSON: {"name": "food name", "calories": number (per 100g), "protein": number, "carbs": number, "fat": number, "portionSize": "serving size", "category": "food category", "defaultUnit": "measurement unit"}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.2,
    });

    const foodData = JSON.parse(response.choices[0].message.content || "{}");
    const foodHash = crypto
      .createHash("md5")
      .update(normalizedQuery)
      .digest("hex")
      .substring(0, 6);

    return {
      id: parseInt(foodHash, 16) % 2000000000, // Keep within PostgreSQL integer limit
      name: foodData.name || query,
      calories:
        Math.round(Number(foodData.calories)) || getDefaultCalories(query),
      protein:
        Math.round(
          (Number(foodData.protein) || getDefaultProtein(query)) * 10,
        ) / 10,
      carbs:
        Math.round((Number(foodData.carbs) || getDefaultCarbs(query)) * 10) /
        10,
      fat: Math.round((Number(foodData.fat) || getDefaultFat(query)) * 10) / 10,
      portionSize: foodData.portionSize || "100g",
      category: foodData.category || categorizeFood(query),
      defaultUnit:
        foodData.defaultUnit || getSmartDefaultUnit(query, foodData.category),
    };
  } catch (error) {
    console.error("Direct AI search failed:", error);
    return createFallbackFood(query);
  }
}

async function getSmartUnitSelection(
  foodName: string,
  category: string = "",
): Promise<{ unit: string; unitOptions: string[]; quantity: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition expert specializing in realistic portion calculations. Return JSON with 'unit' (with exact ml/g amounts), 'unitOptions' (array with sizes), and 'quantity' (realistic default quantity for typical consumption).",
        },
        {
          role: "user",
          content: `For "${foodName}" in category "${category}", determine:
1. Best default unit with exact measurements (e.g., "can (500ml)", "medium portion (150g)")
2. Unit options with realistic sizes 
3. Default quantity for typical consumption

Examples:
- Beer: unit="can (500ml)", quantity=1 (because 1 can = 500ml = 5x the 100ml database value)
- Rice: unit="medium portion (150g)", quantity=1 (because 1 portion = 150g = 1.5x the 100g database value)
- Apple: unit="medium (120g)", quantity=1 (because 1 apple = 120g = 1.2x the 100g database value)

Return JSON: {"unit": "exact_unit_with_size", "unitOptions": ["option1", "option2", "option3"], "quantity": realistic_number}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const fallback = getLocalUnitSelection(foodName, category);
    
    return {
      unit: result.unit || fallback.unit,
      unitOptions: result.unitOptions || fallback.unitOptions,
      quantity: result.quantity || getDefaultQuantityForFood(foodName, category),
    };
  } catch (error) {
    console.error("Smart unit selection error:", error);
    const fallback = getLocalUnitSelection(foodName, category);
    return {
      ...fallback,
      quantity: getDefaultQuantityForFood(foodName, category),
    };
  }
}

// Calculate realistic default quantity based on food type
function getDefaultQuantityForFood(foodName: string, category: string = ""): number {
  const lowerFood = foodName.toLowerCase();
  const lowerCategory = category.toLowerCase();

  // Special case: Water should always be 0 calories regardless of quantity
  if (lowerFood.includes("water")) {
    return 0; // Water has 0 calories always
  }
  
  // Special case: Kingfisher beer should default to 500ml can (5x multiplier)
  if (lowerFood.includes("kingfisher")) {
    return 5; // 500ml can = 5x 100ml base
  }
  
  // Beverages - account for realistic serving sizes
  if (lowerFood.includes("beer")) {
    if (lowerFood.includes("can")) return 5; // 500ml = 5x 100ml  
    if (lowerFood.includes("bottle")) return 6.5; // Default large bottle 650ml = 6.5x 100ml
    if (lowerFood.includes("pint")) return 5.68; // 568ml = 5.68x 100ml
    return 2.5; // Default glass 250ml = 2.5x 100ml
  }

  if (lowerFood.includes("wine")) return 1.5; // 150ml glass = 1.5x 100ml
  if (lowerFood.includes("juice") || lowerFood.includes("soda")) return 2.5; // 250ml = 2.5x 100ml
  if (lowerFood.includes("tea") || lowerFood.includes("coffee")) return 2; // 200ml = 2x 100ml

  // Food portions
  if (lowerFood.includes("rice") || lowerFood.includes("pasta") || lowerFood.includes("curry")) {
    return 1.5; // Medium portion 150g = 1.5x 100g
  }

  if (lowerFood.includes("bread") || lowerFood.includes("roti")) {
    return 0.5; // One slice/piece ~50g = 0.5x 100g
  }

  if (lowerFood.includes("apple") || lowerFood.includes("banana")) {
    return 1.2; // Medium fruit ~120g = 1.2x 100g
  }

  if (lowerFood.includes("chicken") || lowerFood.includes("fish")) {
    return 1.2; // Serving portion ~120g = 1.2x 100g
  }

  // Default multiplier for realistic portions
  return 1;
}

// Calculate accurate nutrition values based on realistic portion sizes
function calculatePortionNutrition(food: any, unit: string, quantity: number) {
  // Special case: Water always has 0 calories regardless of quantity or unit
  if (food.name.toLowerCase().includes("water")) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      multiplier: 0
    };
  }
  
  let multiplier = quantity;
  
  // Extract weight/volume from unit descriptions and calculate multiplier
  const unitLower = unit.toLowerCase();
  
  // For beverages with ml units, calculate proper multiplier based on volume
  if (unitLower === 'ml' || unit === 'ml') {
    // For raw ml units, divide by 100 to get the multiplier (since base is per 100ml)
    multiplier = quantity / 100;
  }
  // Beer and alcohol portion calculations (enhanced pattern matching)
  else if (unitLower.includes('can') && unitLower.includes('500ml')) multiplier = quantity * 5;
  else if (unitLower.includes('bottle') && unitLower.includes('650ml')) multiplier = quantity * 6.5;
  else if (unitLower.includes('bottle') && unitLower.includes('500ml')) multiplier = quantity * 5;
  else if (unitLower.includes('bottle') && unitLower.includes('330ml')) multiplier = quantity * 3.3;
  else if (unitLower.includes('pint') && unitLower.includes('568ml')) multiplier = quantity * 5.68;
  else if (unitLower.includes('glass') && unitLower.includes('250ml')) multiplier = quantity * 2.5;
  
  // Food portion calculations
  else if (unitLower.includes('150g')) multiplier = quantity * 1.5; // Medium portion
  else if (unitLower.includes('100g')) multiplier = quantity * 1; // Standard portion
  else if (unitLower.includes('200g')) multiplier = quantity * 2; // Large portion
  else if (unitLower.includes('50g')) multiplier = quantity * 0.5; // Small portion
  else if (unitLower.includes('120g')) multiplier = quantity * 1.2; // Medium fruit/item
  else if (unitLower.includes('80g')) multiplier = quantity * 0.8; // Small item
  else if (unitLower.includes('180g')) multiplier = quantity * 1.8; // Large item
  
  // Beverage calculations
  else if (unitLower.includes('cup') && unitLower.includes('250ml')) multiplier = quantity * 2.5;
  else if (unitLower.includes('200ml')) multiplier = quantity * 2;
  else if (unitLower.includes('350ml')) multiplier = quantity * 3.5;
  else if (unitLower.includes('500ml')) multiplier = quantity * 5;
  
  // Pack size calculations
  else if (unitLower.includes('30g')) multiplier = quantity * 0.3; // Small pack
  else if (unitLower.includes('50g')) multiplier = quantity * 0.5; // Medium pack
  
  // General unit calculations for backward compatibility
  else if (unitLower.includes('slice')) multiplier = quantity * 0.6;
  else if (unitLower.includes('piece') || unitLower.includes('pieces')) {
    // Context-sensitive piece calculations
    if (food.name.toLowerCase().includes('bread') || food.name.toLowerCase().includes('roti')) {
      multiplier = quantity * 0.5; // Bread slice ~50g
    } else if (food.name.toLowerCase().includes('fruit') || food.name.toLowerCase().includes('apple') || food.name.toLowerCase().includes('banana')) {
      multiplier = quantity * 1.2; // Medium fruit ~120g
    } else {
      multiplier = quantity * 0.8; // Default piece size
    }
  }
  else if (unitLower.includes('small portion')) multiplier = quantity * 0.7;
  else if (unitLower.includes('medium portion')) multiplier = quantity * 1.5;
  else if (unitLower.includes('large portion')) multiplier = quantity * 2;
  else if (unitLower.includes('small') && !unitLower.includes('pack')) multiplier = quantity * 0.7;
  else if (unitLower.includes('medium') && !unitLower.includes('pack')) multiplier = quantity * 1;
  else if (unitLower.includes('large') && !unitLower.includes('pack')) multiplier = quantity * 1.5;
  
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round((food.protein * multiplier) * 10) / 10,
    carbs: Math.round((food.carbs * multiplier) * 10) / 10,
    fat: Math.round((food.fat * multiplier) * 10) / 10,
    multiplier: Math.round(multiplier * 100) / 100
  };
}

function getLocalUnitSelection(foodName: string, category: string = "") {
  const name = foodName.toLowerCase();

  // Water - should always be 0 calories
  if (name.includes("water")) {
    return {
      unit: "glass (250ml)",
      unitOptions: ["glass (250ml)", "bottle (500ml)", "liter", "ml"],
    };
  }
  
  // Beer and alcoholic beverages - realistic serving sizes
  if (name.includes("beer") || name.includes("wine") || name.includes("alcohol")) {
    // For Kingfisher beer specifically, default to 500ml can
    if (name.toLowerCase().includes("kingfisher")) {
      return {
        unit: "can (500ml)", 
        unitOptions: ["can (500ml)", "bottle (330ml)", "bottle (650ml)", "pint (568ml)", "glass (250ml)"],
      };
    }
    // For other beers, check if can is mentioned
    if (name.includes("can")) {
      return {
        unit: "can (500ml)",
        unitOptions: ["can (500ml)", "bottle (330ml)", "bottle (650ml)", "pint (568ml)", "glass (250ml)"],
      };
    }
    return {
      unit: "bottle (650ml)",
      unitOptions: ["glass (250ml)", "bottle (330ml)", "bottle (500ml)", "bottle (650ml)", "can (500ml)"],
    };
  }

  // Beverages and liquids
  if (
    name.includes("juice") ||
    name.includes("water") ||
    name.includes("tea") ||
    name.includes("coffee") ||
    name.includes("milk") ||
    name.includes("lassi") ||
    name.includes("shake")
  ) {
    return { 
      unit: "cup (250ml)", 
      unitOptions: ["cup (250ml)", "glass (200ml)", "bottle (500ml)", "small cup (150ml)", "large cup (350ml)"] 
    };
  }

  // Rice and curry dishes
  if (
    name.includes("rice") ||
    name.includes("curry") ||
    name.includes("dal") ||
    name.includes("biryani")
  ) {
    return {
      unit: "medium portion (150g)",
      unitOptions: ["small portion (100g)", "medium portion (150g)", "large portion (200g)", "bowl", "grams"],
    };
  }

  // Countable items
  if (
    name.includes("roti") ||
    name.includes("chapati") ||
    name.includes("slice") ||
    name.includes("piece") ||
    name.includes("samosa") ||
    name.includes("pakora") ||
    name.includes("apple") ||
    name.includes("banana")
  ) {
    return {
      unit: "pieces",
      unitOptions: ["pieces", "small (80g)", "medium (120g)", "large (180g)", "grams"],
    };
  }

  // Default
  return {
    unit: "medium (100g)",
    unitOptions: ["pieces", "grams", "small (80g)", "medium (100g)", "large (150g)"],
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        subscriptionStatus: user.subscriptionStatus,
        premiumActivated: user.premiumActivated,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin testing route - bypasses all usage limits
  app.post("/api/admin-login", async (req, res) => {
    try {
      const { adminKey } = req.body;

      // Simple admin key check - you can change this secret
      const ADMIN_SECRET = process.env.ADMIN_SECRET || "calonik_admin_2025";

      if (adminKey !== ADMIN_SECRET) {
        return res.status(401).json({ error: "Invalid admin key" });
      }

      // Create or get admin user with unlimited access
      const adminUser = await storage.upsertUser({
        id: "admin_testing_user",
        email: "admin@calonik.ai",
        firstName: "Admin",
        lastName: "User",
        subscriptionStatus: "premium", // Give premium status for unlimited access
        premiumActivatedAt: new Date(),
        subscriptionEndsAt: new Date(
          Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
        ), // 10 years
      });

      res.json({
        success: true,
        sessionId: "admin_testing_user",
        message: "Admin access granted with unlimited usage",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  });

  // Food routes
  app.get("/api/foods", async (req, res) => {
    try {
      const foods = await storage.getAllFoods();
      res.json(foods);
    } catch (error) {
      console.error("Error fetching foods:", error);
      res.json([]);
    }
  });

  // AI food storage endpoint for detected foods
  app.post("/api/ai-food", async (req, res) => {
    try {
      const {
        id,
        name,
        calories,
        protein,
        carbs,
        fat,
        portionSize,
        category,
        defaultUnit,
      } = req.body;

      const aiFood = {
        id: id || Date.now(),
        name: name || "Unknown Food",
        calories: calories || 100,
        protein: protein || 5,
        carbs: carbs || 15,
        fat: fat || 3,
        portionSize: portionSize || "100g",
        category: category || "AI Detected",
        defaultUnit: defaultUnit || "serving",
      };

      await storage.storeAiFood(aiFood);
      console.log("AI food stored:", aiFood.name);
      res.json(aiFood);
    } catch (error) {
      console.error("Error storing AI food:", error);
      res.status(500).json({ message: "Failed to store AI food" });
    }
  });

  // Smart unit suggestion endpoint with intelligent portion calculation
  app.post("/api/smart-unit", async (req, res) => {
    try {
      const { foodName, category, food } = req.body;
      
      if (!foodName) {
        return res.status(400).json({ message: "Food name is required" });
      }
      
      const smartUnits = await getSmartUnitSelection(foodName, category || "");
      
      // If food data is provided, calculate accurate nutrition for the recommended portion
      if (food) {
        const portionNutrition = calculatePortionNutrition(food, smartUnits.unit, smartUnits.quantity);
        res.json({
          ...smartUnits,
          recommendedNutrition: portionNutrition,
          explanation: `Showing calories for ${smartUnits.quantity} ${smartUnits.unit} (realistic portion size)`
        });
      } else {
        res.json(smartUnits);
      }
    } catch (error) {
      console.error("Smart unit selection error:", error);
      res.status(500).json({ message: "Failed to get smart unit suggestions" });
    }
  });

  app.get("/api/foods/search", async (req, res) => {
    try {
      const validation = searchFoodsSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid search query" });
      }

      const { query } = validation.data;
      let foods: any[] = [];

      // Use fallback storage and AI search
      try {
        foods = await storage.searchFoods(query);
      } catch (error) {
        console.warn("Storage search failed");
      }

      // If no foods found, use AI search
      if (foods.length === 0 && process.env.OPENAI_API_KEY) {
        try {
          const aiFood = await searchFoodDirectly(query);
          await storage.storeAiFood(aiFood);
          foods = [aiFood];
        } catch (aiError) {
          console.warn("AI search failed, using intelligent fallback");
          foods = [createFallbackFood(query)];
        }
      } else if (foods.length === 0) {
        foods = [createFallbackFood(query)];
      }

      // Enhance each food with intelligent portion suggestions
      const enhancedFoods = await Promise.all(foods.map(async (food) => {
        try {
          const smartUnits = await getSmartUnitSelection(food.name, food.category);
          const portionNutrition = calculatePortionNutrition(food, smartUnits.unit, smartUnits.quantity);
          
          console.log(`Enhanced ${food.name}: ${food.calories} cal/100ml -> ${portionNutrition.calories} cal for ${smartUnits.quantity} ${smartUnits.unit}`);
          
          return {
            ...food,
            smartUnit: smartUnits.unit,
            smartQuantity: smartUnits.quantity,
            smartUnitOptions: smartUnits.unitOptions,
            realisticCalories: portionNutrition.calories,
            realisticProtein: portionNutrition.protein,
            realisticCarbs: portionNutrition.carbs,
            realisticFat: portionNutrition.fat,
            portionMultiplier: portionNutrition.multiplier,
            portionExplanation: `${smartUnits.quantity} ${smartUnits.unit} contains ${portionNutrition.calories} calories (${food.calories} cal per ${food.portionSize})`
          };
        } catch (error) {
          console.warn(`Failed to enhance food ${food.name}:`, error);
          return food;
        }
      }));

      console.log(`Returning ${enhancedFoods.length} enhanced foods`);
      res.json(enhancedFoods);
    } catch (error) {
      console.error("Search route error:", error);
      res.json([createFallbackFood("unknown food")]);
    }
  });

  // Meal routes with authentication and proper user-based persistence
  app.get("/api/meals/:sessionId", async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      // Use Replit user ID if authenticated, otherwise use session ID
      const userSessionId = req.user?.id || sessionId;
      const meals = await storage.getMealItems(userSessionId);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.json([]);
    }
  });

  // Alternative meal endpoint for compatibility with Firebase auth
  app.get("/api/meal/:sessionId", async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      // Use Replit user ID if authenticated, otherwise use session ID
      const userSessionId = req.user?.id || sessionId;
      const meals = await storage.getMealItems(userSessionId);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.json([]);
    }
  });

  // Get meal items for specific date
  app.get("/api/meal/:sessionId/:date", async (req: any, res) => {
    try {
      const { sessionId, date } = req.params;
      // Use the provided session ID directly (it's already the effective user ID from frontend)

      console.log(`Fetching meals for session ${sessionId} on date ${date}`);
      const meals = await storage.getMealItems(sessionId, date);
      console.log(`Found ${meals.length} meals for ${date}`);

      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals for date:", error);
      res.json([]);
    }
  });

  app.post("/api/meals", async (req: any, res) => {
    try {
      // Use Replit user ID if authenticated, otherwise use session ID
      const mealData = {
        ...req.body,
        sessionId: req.user?.id || req.body.sessionId,
      };

      const validation = insertMealItemSchema.safeParse(mealData);
      if (!validation.success) {
        return res
          .status(400)
          .json({
            message: "Invalid meal item data",
            errors: validation.error.issues,
          });
      }

      const meal = await storage.addMealItem(validation.data);
      console.log(
        "Meal added successfully:",
        meal.id,
        "for food:",
        meal.foodId,
      );
      res.json(meal);
    } catch (error) {
      console.error("Error adding meal:", error);
      res.status(500).json({ message: "Failed to add meal" });
    }
  });

  // Alternative meal endpoint for compatibility with Firebase auth
  app.post("/api/meal", async (req: any, res) => {
    try {
      // Use the session ID provided from frontend (it's already the effective user ID)
      const mealData = {
        sessionId: req.body.sessionId,
        foodId: Number(req.body.foodId),
        quantity: Number(req.body.quantity),
        unit: req.body.unit,
        date: req.body.date || new Date().toISOString().split("T")[0],
      };

      console.log("Adding meal with data:", mealData);

      const validation = insertMealItemSchema.safeParse(mealData);
      if (!validation.success) {
        console.log("Validation failed:", validation.error.issues);
        return res
          .status(400)
          .json({
            message: "Invalid meal item data",
            errors: validation.error.issues,
          });
      }

      // Store the AI food first if it doesn't exist
      const food = await storage.getFoodById(mealData.foodId);
      if (!food) {
        console.log(
          "Food not found in storage, this might be an AI-generated food",
        );
      }

      const meal = await storage.addMealItem(validation.data);
      console.log(
        "Meal added successfully:",
        meal.id,
        "for food:",
        meal.foodId,
        "on date:",
        meal.date,
      );
      res.json(meal);
    } catch (error) {
      console.error("Error adding meal:", error);
      res.status(500).json({ message: "Failed to add meal" });
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      const id = parseFloat(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const success = await storage.removeMealItem(id);
      if (!success) {
        return res.status(404).json({ message: "Meal not found" });
      }

      res.json({ message: "Meal removed successfully" });
    } catch (error) {
      console.error("Error removing meal:", error);
      res.status(500).json({ message: "Failed to remove meal" });
    }
  });

  // Alternative meal deletion endpoint for compatibility
  app.delete("/api/meal/:id", async (req, res) => {
    try {
      const id = parseFloat(req.params.id);
      console.log(`DELETE /api/meal/${req.params.id} - Parsed ID:`, id);
      if (isNaN(id)) {
        console.log("Invalid ID provided:", req.params.id);
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const success = await storage.removeMealItem(id);
      console.log(`Removal result:`, success);
      if (!success) {
        return res.status(404).json({ message: "Meal not found" });
      }

      res.json({ message: "Meal removed successfully" });
    } catch (error) {
      console.error("Error removing meal:", error);
      res.status(500).json({ message: "Failed to remove meal" });
    }
  });

  // Clear meal endpoint for compatibility with frontend - supports date-specific clearing
  app.delete("/api/meal/clear/:sessionId/:date?", async (req: any, res) => {
    try {
      const { sessionId, date } = req.params;
      // Use authenticated user ID if available, otherwise use session ID
      const effectiveSessionId = req.user?.id || sessionId;
      const targetDate = date || new Date().toISOString().split("T")[0];

      console.log(
        `Clearing meal for session: ${effectiveSessionId} on date: ${targetDate}`,
      );
      const success = await storage.clearMeal(
        effectiveSessionId,
        targetDate,
      );
      console.log(`Meal clear result: ${success}`);

      res.json({ message: "Meal cleared successfully", cleared: success });
    } catch (error) {
      console.error("Error clearing meal:", error);
      res.status(500).json({ message: "Failed to clear meal" });
    }
  });

  app.delete("/api/meals/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const success = await storage.clearMeal(sessionId);
      res.json({ message: "Meal cleared successfully", cleared: success });
    } catch (error) {
      console.error("Error clearing meal:", error);
      res.status(500).json({ message: "Failed to clear meal" });
    }
  });

  // Profile routes with authentication
  app.get("/api/profile/:sessionId", async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      // Use Replit user ID if authenticated, otherwise use session ID
      const userSessionId = req.user?.id || sessionId;
      const profile = await storage.getUserProfile(userSessionId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile/calculate", async (req: any, res) => {
    try {
      const validation = calculateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({
            message: "Invalid profile data",
            errors: validation.error.issues,
          });
      }

      const data = validation.data;

      // Use Replit user ID if authenticated, otherwise use session ID
      const userSessionId = req.user?.id || data.sessionId;

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr: number;
      if (data.gender === "male") {
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
      } else {
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;
      }

      // Calculate TDEE based on activity level
      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9,
      };

      const tdee = bmr * (activityMultipliers[data.activityLevel] || 1.2);

      // Calculate target calories based on weight goal
      let targetCalories = tdee;
      let dailyProteinTarget = 0;
      
      if (data.weightGoal === "lose") {
        targetCalories = tdee - 500; // 500 calorie deficit for 1lb/week loss
        dailyProteinTarget = Math.round(data.weight * 1.2); // 1.2g per kg for weight loss
      } else if (data.weightGoal === "gain") {
        targetCalories = tdee + 500; // 500 calorie surplus for 1lb/week gain
        dailyProteinTarget = Math.round(data.weight * 1.6); // 1.6g per kg for weight gain
      } else if (data.weightGoal === "muscle") {
        targetCalories = tdee + 300; // Moderate surplus for muscle building
        dailyProteinTarget = Math.round(data.weight * 2.0); // 2.0g per kg for muscle building
      }

      const profileData = {
        ...data,
        sessionId: userSessionId,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetProtein: dailyProteinTarget,
      };

      const profile = await storage.saveUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error calculating profile:", error);
      res.status(500).json({ message: "Failed to calculate profile" });
    }
  });

  // Date-specific exercise route (must come before the general route)
  app.get("/api/exercise/:sessionId/:date", async (req, res) => {
    try {
      const { sessionId, date } = req.params;
      console.log(
        `Fetching exercises for session ${sessionId} on date ${date}`,
      );
      // Use authenticated user ID if available, otherwise use session ID
      const effectiveSessionId = req.user?.id || sessionId;
      const exercises = await storage.getExercises(
        effectiveSessionId,
        date,
      );
      console.log(`Found ${exercises.length} exercises for date ${date}`);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises for date:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.post("/api/exercise", async (req, res) => {
    try {
      console.log("Exercise POST - received body:", req.body);
      const validation = insertExerciseSchema.safeParse(req.body);
      if (!validation.success) {
        console.log(
          "Exercise POST - validation failed:",
          validation.error.issues,
        );
        return res
          .status(400)
          .json({
            message: "Invalid exercise data",
            errors: validation.error.issues,
          });
      }

      console.log("Exercise POST - validated data:", validation.data);
      const exercise = await storage.addExercise(validation.data);
      console.log("Exercise POST - stored exercise:", exercise);
      res.json(exercise);
    } catch (error) {
      console.error("Error adding exercise:", error);
      res.status(500).json({ message: "Failed to add exercise" });
    }
  });

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

      res.json({ message: "Exercise removed successfully" });
    } catch (error) {
      console.error("Error removing exercise:", error);
      res.status(500).json({ message: "Failed to remove exercise" });
    }
  });

  app.delete("/api/exercise/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const success = await storage.clearExercises(sessionId);
      res.json({ message: "Exercises cleared successfully", cleared: success });
    } catch (error) {
      console.error("Error clearing exercises:", error);
      res.status(500).json({ message: "Failed to clear exercises" });
    }
  });

  // Food image analysis route with usage tracking
  app.post("/api/analyze-food-image", async (req: any, res) => {
    try {
      const { image, sessionId } = req.body;

      if (!image) {
        return res.status(400).json({ message: "Image data required" });
      }

      // Check if this is an admin session - bypass all limits
      const isAdminSession =
        sessionId === "admin_testing_user" ||
        (req.user && req.user.uid === "admin_testing_user");

      // Check usage limits for authenticated users (but not admin)
      if (req.user && !isAdminSession) {
        const userId = req.user.id;
        const user = await storage.getUser(userId);
        const isPremium = user?.subscriptionStatus === "premium";

        console.log(
          `User ${userId} premium status: ${isPremium}, subscription: ${user?.subscriptionStatus}`,
        );

        // Check if user can perform photo analysis
        const canPerform = await storage.canUserPerformAction(
          userId,
          "photo_analyze",
        );
        if (!canPerform) {
          console.log(
            `User ${userId} cannot perform photo analysis - limit reached`,
          );

          if (isPremium) {
            return res.status(402).json({
              message:
                "Daily limit reached. Premium users get 5 photo analyses per day.",
              isLimitReached: true,
            });
          } else {
            return res.status(402).json({
              message:
                "Daily limit reached. Free users get 2 photo analyses per day. Upgrade to premium for 5 daily analyses.",
              requiresUpgrade: true,
            });
          }
        }

        console.log(
          `User ${userId} can perform photo analysis - tracking usage`,
        );
        // Track photo analysis usage
        await storage.trackUsage(userId, "photo_analyze");
      }

      if (!process.env.OPENAI_API_KEY) {
        return res
          .status(400)
          .json({ message: "AI analysis service not available" });
      }

      console.log("Starting food image analysis...");

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content:
              "You are a food recognition expert specializing in Indian, Asian, and international cuisines. Analyze food images and provide detailed nutritional information. Always return valid JSON format.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Analyze this food image and identify all visible food items. For each food provide: name, calories (per 100g), protein (g), carbs (g), fat (g), confidence (0-100), estimatedQuantity. Return JSON: {"foods": [{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": number, "estimatedQuantity": "serving description"}], "suggestions": ["tips or recommendations"]}',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.3,
      });

      console.log("OpenAI analysis complete");
      const result = JSON.parse(response.choices[0].message.content || "{}");
      console.log("Parsed result:", result);

      if (!result.foods || !Array.isArray(result.foods)) {
        console.warn("No foods detected in image");
        return res.json({
          foods: [],
          suggestions: [
            "Could not identify food items in the image. Try uploading a clearer image.",
          ],
        });
      }

      // Enhanced validation and normalization
      const validatedFoods = result.foods.map((food: any) => {
        const normalizedFood = {
          name: food.name || "Unknown Food",
          calories: Math.max(
            1,
            Math.round(
              Number(food.calories) || getDefaultCalories(food.name || ""),
            ),
          ),
          protein: Math.max(
            0,
            Math.round(
              (Number(food.protein) || getDefaultProtein(food.name || "")) * 10,
            ) / 10,
          ),
          carbs: Math.max(
            0,
            Math.round(
              (Number(food.carbs) || getDefaultCarbs(food.name || "")) * 10,
            ) / 10,
          ),
          fat: Math.max(
            0,
            Math.round(
              (Number(food.fat) || getDefaultFat(food.name || "")) * 10,
            ) / 10,
          ),
          confidence: Math.min(
            100,
            Math.max(10, Math.round(Number(food.confidence) || 75)),
          ),
          estimatedQuantity: food.estimatedQuantity || "1 serving",
        };
        console.log("Validated food:", normalizedFood);
        return normalizedFood;
      });

      console.log(`Successfully analyzed ${validatedFoods.length} food items`);

      res.json({
        foods: validatedFoods,
        suggestions: result.suggestions || ["Foods detected successfully!"],
      });
    } catch (error) {
      console.error("Food image analysis error:", error);
      res.status(500).json({
        message: "Failed to analyze food image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Daily summary routes with Replit authentication for proper user-based persistence
  app.get("/api/daily-summaries/:sessionId", async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      // Use Replit user ID if authenticated, otherwise use session ID
      const userSessionId = req.user?.id || sessionId;
      const summaries = await storage.getDailySummaries(userSessionId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching daily summaries:", error);
      res.json([]);
    }
  });

  app.get("/api/daily-summary/:sessionId/:date", async (req: any, res) => {
    try {
      const { sessionId, date } = req.params;
      // Use Replit user ID if authenticated, otherwise use session ID
      const userSessionId = req.user?.id || sessionId;
      const summary = await storage.getDailySummary(
        userSessionId,
        date,
      );
      res.json(summary);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
      res.json(null);
    }
  });

  app.post("/api/daily-summary", async (req: any, res) => {
    try {
      // Ensure date is today's date for proper calendar functionality
      const today = new Date().toISOString().split("T")[0];

      // Use Replit user ID if authenticated, otherwise use session ID
      const summaryData = {
        ...req.body,
        sessionId: req.user?.id || req.body.sessionId,
        date: req.body.date || today,
      };

      const validation = insertDailySummarySchema.safeParse(summaryData);
      if (!validation.success) {
        return res
          .status(400)
          .json({
            message: "Invalid daily summary data",
            errors: validation.error.issues,
          });
      }

      const summary = await storage.saveDailySummary(validation.data);
      console.log("Daily summary saved successfully:", summary.id);
      res.json(summary);
    } catch (error) {
      console.error("Error saving daily summary:", error);
      res.status(500).json({ message: "Failed to save daily summary" });
    }
  });

  // AI Profile Insights endpoint
  app.post("/api/ai-profile-insights", async (req, res) => {
    try {
      const {
        gender,
        age,
        weight,
        weightGoal,
        targetCalories,
        tdee,
        activityLevel,
        weightTarget,
      } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        // Generate intelligent fallback insights
        let insights = [];

        if (weightGoal === "lose") {
          insights.push(
            "You're targeting a healthy calorie deficit for sustainable weight loss.",
          );
          if (activityLevel === "sedentary") {
            insights.push(
              "Adding light exercise could boost your metabolism and help preserve muscle mass during weight loss.",
            );
          }
          if (targetCalories < 1200) {
            insights.push(
              "Your calorie target is quite low - consider a more moderate approach for long-term success.",
            );
          }
        } else if (weightGoal === "gain") {
          insights.push(
            "You're in a calorie surplus to support healthy weight gain and muscle building.",
          );
          insights.push(
            "Focus on strength training to ensure quality weight gain rather than just fat accumulation.",
          );
        } else if (weightGoal === "muscle") {
          insights.push(
            "Your moderate calorie surplus is optimized for lean muscle building while minimizing fat gain.",
          );
          insights.push(
            "Prioritize protein intake (2g per kg body weight) and progressive resistance training for optimal results.",
          );
          insights.push(
            "Track your daily protein consumption to ensure you're meeting your muscle-building targets.",
          );
        }

        if (age < 25) {
          insights.push(
            "Your young metabolism is an advantage - maintain consistent nutrition habits now for lifelong benefits.",
          );
        } else if (age > 45) {
          insights.push(
            "As metabolism naturally slows with age, prioritize protein intake and resistance training.",
          );
        }

        const deficit = Math.abs(tdee - targetCalories);
        if (deficit > 750) {
          insights.push(
            "Your calorie adjustment is quite aggressive - consider a more gradual approach for better adherence.",
          );
        }

        return res.json({
          insights: insights.join(" "),
          fallback: true,
        });
      }

      const prompt = `As a nutrition expert, provide personalized insights for this health profile:
      
      Profile:
      - Gender: ${gender}
      - Age: ${age} years
      - Weight: ${weight} kg
      - Goal: ${weightGoal} weight
      - Target: ${weightTarget} kg to ${weightGoal}
      - Activity: ${activityLevel}
      - TDEE: ${tdee} calories
      - Target Calories: ${targetCalories} calories
      
      Provide 2-3 specific, actionable insights in 100 words or less. Focus on:
      1. Their calorie strategy effectiveness
      2. Activity level recommendations
      3. One metabolic or age-specific tip
      
      Be encouraging and specific to their profile.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a certified nutrition expert providing personalized health insights. Be specific, encouraging, and scientifically accurate.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const insights =
        response.choices[0].message.content ||
        "Your profile looks good! Focus on consistency with your nutrition and exercise plan.";

      res.json({
        insights: insights.trim(),
        fallback: false,
      });
    } catch (error) {
      console.error("AI insights error:", error);

      // Fallback insights on error
      const { weightGoal, activityLevel, age } = req.body;
      let fallbackInsights =
        "Your nutrition plan is well-structured for your goals. ";

      if (weightGoal === "lose") {
        fallbackInsights +=
          "Stay consistent with your calorie deficit and consider adding more physical activity. ";
      } else {
        fallbackInsights +=
          "Focus on protein-rich foods and strength training for quality weight gain. ";
      }

      if (activityLevel === "sedentary") {
        fallbackInsights +=
          "Even light daily walks can significantly boost your results.";
      }

      res.json({
        insights: fallbackInsights,
        fallback: true,
      });
    }
  });

  // Razorpay payment routes
  app.post(
    "/api/create-razorpay-order",
    isAuthenticated,
    async (req: any, res) => {
      try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          return res.status(400).json({ message: "Razorpay not configured" });
        }

        if (!razorpay) {
          razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
        }

        const { amount, currency, planType = "monthly" } = req.body;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        // Get user details for order
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const options = {
          amount: amount, // amount in paise (₹399 = 39900 paise)
          currency: currency || "INR",
          receipt: `calonik_${planType}_${Date.now()}`,
          notes: {
            userId: userId,
            userEmail: user.email || "",
            subscription: `premium_${planType}`,
            planType: planType,
            appName: "Calonik.ai",
          },
        };

        const order = await razorpay.orders.create(options);

        console.log(`Created Razorpay order for user ${userId}: ${order.id}`);

        return res.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        });
      } catch (error) {
        console.error("Razorpay order creation error:", error);
        return res
          .status(500)
          .json({ error: "Failed to create Razorpay order" });
      }
    },
  );

  // Razorpay payment verification route
  app.post(
    "/api/verify-razorpay-payment",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          req.body;
        console.error(razorpay_signature);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "User not authenticated" });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
          return res.status(500).json({ error: "Razorpay not configured" });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest("hex");

        console.log(`Payment verification for user ${userId}:`);
        console.log(`Order ID: ${razorpay_order_id}`);
        console.log(`Payment ID: ${razorpay_payment_id}`);
        console.log(`Received signature: ${razorpay_signature}`);
        console.log(`Expected signature: ${expectedSignature}`);

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
          // Activate premium subscription using the correct storage
          const updatedUser = await storage.activatePremiumSubscription(
            userId,
            {
              customerId: razorpay_payment_id,
              subscriptionId: razorpay_order_id,
            },
          );

          console.log(`Premium subscription activated for user: ${userId}`);

          res.json({
            message: "Payment verified and premium subscription activated",
            user: updatedUser,
          });
        } else {
          console.error(
            `Payment signature verification failed for user ${userId}`,
          );
          res.status(400).json({ error: "Invalid payment signature" });
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ error: "Payment verification failed" });
      }
    },
  );

  // Razorpay webhook endpoint for automatic premium activation
  app.post(
    "/api/razorpay-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
          console.warn("Razorpay webhook secret not configured");
          return res
            .status(200)
            .json({ message: "Webhook secret not configured" });
        }

        // Verify webhook signature
        const crypto = require("crypto");
        const signature = req.headers["x-razorpay-signature"];
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(req.body)
          .digest("hex");

        if (signature !== expectedSignature) {
          console.error("Invalid webhook signature");
          return res.status(400).json({ message: "Invalid signature" });
        }

        const event = JSON.parse(req.body.toString());
        console.log("Razorpay webhook event:", event.event);

        // Handle payment.captured event
        if (event.event === "payment.captured") {
          const payment = event.payload.payment.entity;
          const orderId = payment.order_id;
          const paymentId = payment.id;

          // Get user ID from order notes
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });

          try {
            const order = await razorpay.orders.fetch(orderId);
            const userId = order.notes?.userId;

            if (!userId) {
              console.error("User ID not found in order notes");
              return res.status(400).json({ message: "User ID not found" });
            }

            // Check if user exists
            const user = await storage.getUser(userId);
            if (!user) {
              console.error(`User not found: ${userId}`);
              return res.status(404).json({ message: "User not found" });
            }

            // Activate premium subscription
            const updatedUser = await storage.activatePremiumSubscription(
              userId,
              {
                customerId: paymentId,
                subscriptionId: orderId,
              },
            );

            console.log(`Premium activated for user ${userId} via webhook`);

            // For webhook, we need to respond to Razorpay but we can't redirect the user directly
            // The frontend payment handler will handle the redirect
            res.status(200).json({
              message: "Premium subscription activated successfully",
              userId: userId,
              redirectUrl: "https://calonik.ai/payment-success",
            });
          } catch (orderError) {
            console.error("Error fetching order details:", orderError);
            res.status(500).json({ message: "Failed to process webhook" });
          }
        } else {
          // Handle other webhook events if needed
          console.log(`Unhandled webhook event: ${event.event}`);
          res.status(200).json({ message: "Event received but not processed" });
        }
      } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
      }
    },
  );

  // Usage stats endpoint
  app.get("/api/usage-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split("T")[0];

      const [photoUsage, mealUsage] = await Promise.all([
        storage.getUserUsage(userId, "photo_analyze", today),
        storage.getUserUsage(userId, "meal_add", today),
      ]);

      const user = await storage.getUser(userId);
      const isPremium = user?.subscriptionStatus === "premium";

      console.log(
        `Usage stats debug - userId: ${userId}, user found: ${!!user}, subscription: ${user?.subscriptionStatus}, isPremium: ${isPremium}`,
      );

      const limits = isPremium
        ? { photos: 5, meals: 20 }
        : { photos: 2, meals: 1 };

      const remainingPhotos = Math.max(0, limits.photos - photoUsage);
      const remainingMeals = Math.max(0, limits.meals - mealUsage);

      console.log(
        `Usage stats for ${userId}: photos used: ${photoUsage}/${limits.photos}, meals used: ${mealUsage}/${limits.meals}, isPremium: ${isPremium}`,
      );
      console.log(
        `Remaining: photos: ${remainingPhotos}, meals: ${remainingMeals}`,
      );

      res.json({
        photos: photoUsage,
        meals: mealUsage,
        limits,
        remaining: {
          photos: remainingPhotos,
          meals: remainingMeals,
        },
        isPremium,
      });
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });

  // Save daily weight
  app.post("/api/daily-weight", async (req, res) => {
    try {
      console.log("Daily weight request body:", req.body);
      
      // Validate request body
      const validationResult = insertDailyWeightSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Daily weight validation errors:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid weight data", 
          errors: validationResult.error.errors 
        });
      }

      const weightData = validationResult.data;
      console.log("Validated weight data:", weightData);
      
      const savedWeight = await storage.saveDailyWeight(weightData);
      console.log("Saved weight successfully:", savedWeight);
      
      // Check if weight goal is achieved
      const profile = await storage.getUserProfile(weightData.sessionId);
      if (profile && !profile.goalAchieved) {
        const goalResult = await checkWeightGoalAchievement(
          weightData.sessionId, 
          weightData.weight, 
          profile
        );
        
        if (goalResult.achieved) {
          await markGoalAsAchieved(weightData.sessionId);
          console.log(`Weight goal achieved for session: ${weightData.sessionId}`);
          
          // Return achievement message with weight data
          res.json({
            ...savedWeight,
            goalAchieved: true,
            achievementMessage: goalResult.message
          });
          return;
        }
      }
      
      res.json(savedWeight);
    } catch (error) {
      console.error("Error saving daily weight:", error);
      res.status(500).json({ message: "Failed to save daily weight" });
    }
  });

  // Clear achieved weight goal endpoint
  app.post("/api/clear-achieved-goal", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const profile = await storage.getUserProfile(sessionId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Clear the achieved goal
      await storage.saveUserProfile({
        ...profile,
        weightGoal: 'maintain',
        weightTarget: null,
        goalAchieved: false,
        goalAchievedAt: null,
        sessionId: profile.sessionId
      });

      res.json({ message: "Goal cleared successfully", cleared: true });
    } catch (error) {
      console.error("Error clearing achieved goal:", error);
      res.status(500).json({ message: "Failed to clear goal" });
    }
  });

  // Test endpoint to trigger nudge scheduler manually
  app.post('/api/test-nudges', async (req, res) => {
    try {
      console.log("=== Manual nudge test triggered ===");
      
      // Run nudge checker directly with manual logging
      const now = new Date();
      const currentHour = now.getHours();
      const today = now.toISOString().split('T')[0];
      
      console.log(`Testing nudge scheduler at ${currentHour}:00 for date ${today}`);
      
      // Get all users from database
      const users = await storage.getAllUsers();
      console.log(`Found ${users.length} users in database`);
      
      let nudgesSent = 0;
      for (const user of users) {
        console.log(`Checking user: ${user.email}, subscription: ${user.subscriptionStatus}`);
        
        if (user.email && user.subscriptionStatus === 'premium') {
          console.log(`Would send nudge to premium user: ${user.email}`);
          nudgesSent++;
          
          // For testing, we'll just log instead of actually sending emails
          // since SENDGRID_API_KEY is not configured
        }
      }
      
      console.log(`=== Nudge test completed: ${nudgesSent} nudges would be sent ===`);
      
      res.json({ 
        message: "Nudge scheduler test completed", 
        timestamp: new Date().toISOString(),
        usersFound: users.length,
        nudgesWouldSend: nudgesSent,
        testMode: true
      });
    } catch (error) {
      console.error("Error in manual nudge test:", error);
      res.status(500).json({ 
        message: "Failed to run nudge test", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

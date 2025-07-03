import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { fallbackStorage } from "./fallbackStorage";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { optionalAuth } from "./firebaseAuth";
import { db } from "./db";
import {
  insertMealItemSchema,
  insertUserProfileSchema,
  insertExerciseSchema,
  insertDailySummarySchema,
  insertDailyWeightSchema,
  searchFoodsSchema,
  calculateProfileSchema,
  hourlyActivities,
  dailySummaries,
  dailyWeights,
  usageTracking,
  users,
  exercises,
  mealItems,
} from "@shared/schema";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { calculateNutritionFromUnit, validateCalorieCalculation } from "@shared/unitCalculations";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import { checkWeightGoalAchievement, markGoalAsAchieved } from "./weightGoalChecker";
import { testHourlyNudge } from "./hourlyNudgeScheduler";
import { ImageOptimizer } from "./imageOptimizer";
import { ImageCache } from "./imageCache";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

    if (!process.env.GEMINI_API_KEY) {
      return createFallbackFood(query);
    }

    const prompt = `You are a nutrition expert specializing in Indian, Asian, and international cuisines. Provide accurate nutritional information. Return only valid JSON with exact fields: name, calories, protein, carbs, fat, portionSize, category, defaultUnit. Focus on realistic values for authentic dishes.

Analyze this food item and provide comprehensive nutrition data: "${query}"

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

Consider regional variations and authentic preparation methods.`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            portionSize: { type: "string" },
            category: { type: "string" },
            defaultUnit: { type: "string" },
          },
          required: ["name", "calories", "protein", "carbs", "fat", "portionSize", "category", "defaultUnit"],
        },
      },
      contents: prompt,
    });

    const foodData = JSON.parse(response.text || "{}");

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
      smartPortionGrams: null,
      smartCalories: null,
      smartProtein: null,
      smartCarbs: null,
      smartFat: null,
      aiConfidence: null,
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
    smartPortionGrams: null,
    smartCalories: null,
    smartProtein: null,
    smartCarbs: null,
    smartFat: null,
    aiConfidence: null,
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

// Direct AI search without database dependency using Gemini
async function searchFoodDirectly(query: string) {
  const normalizedQuery = query.toLowerCase().trim();

  if (!process.env.GEMINI_API_KEY) {
    return createFallbackFood(query);
  }

  try {
    const prompt = `You are a nutrition expert. Provide accurate nutritional information for foods. Return only valid JSON with exact fields: name, calories, protein, carbs, fat, portionSize, category, defaultUnit. Focus on realistic values.

Provide nutrition data for: "${query}". Return JSON: {"name": "food name", "calories": number (per 100g), "protein": number, "carbs": number, "fat": number, "portionSize": "serving size", "category": "food category", "defaultUnit": "measurement unit"}`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            portionSize: { type: "string" },
            category: { type: "string" },
            defaultUnit: { type: "string" },
          },
          required: ["name", "calories", "protein", "carbs", "fat", "portionSize", "category", "defaultUnit"],
        },
      },
      contents: prompt,
    });

    const foodData = JSON.parse(response.text || "{}");
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
    console.error("Gemini AI search failed:", error);
    return createFallbackFood(query);
  }
}

async function getSmartUnitSelection(
  foodName: string,
  category: string = "",
): Promise<{ unit: string; unitOptions: string[]; quantity: number }> {
  try {
    const prompt = `You are a nutrition expert specializing in realistic portion calculations. Return JSON with 'unit' (with exact ml/g amounts), 'unitOptions' (array with sizes), and 'quantity' (realistic default quantity for typical consumption).

For "${foodName}" in category "${category}", determine:
1. Best default unit with exact measurements (e.g., "can (500ml)", "medium portion (150g)")
2. Unit options with realistic sizes 
3. Default quantity for typical consumption

Examples:
- Beer: unit="can (500ml)", quantity=1 (because 1 can = 500ml = 5x the 100ml database value)
- Rice: unit="medium portion (150g)", quantity=1 (because 1 portion = 150g = 1.5x the 100g database value)
- Apple: unit="medium (120g)", quantity=1 (because 1 apple = 120g = 1.2x the 100g database value)

Return JSON: {"unit": "exact_unit_with_size", "unitOptions": ["option1", "option2", "option3"], "quantity": realistic_number}`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            unit: { type: "string" },
            unitOptions: { 
              type: "array",
              items: { type: "string" }
            },
            quantity: { type: "number" },
          },
          required: ["unit", "unitOptions", "quantity"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
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
  
  // For grams unit, calculate direct multiplier based on gram amount
  if (unitLower === 'grams' || unit === 'grams') {
    // For raw gram units, divide by 100 to get the multiplier (since base is per 100g)
    multiplier = quantity / 100;
  }
  // For beverages with ml units, calculate proper multiplier based on volume
  else if (unitLower === 'ml' || unit === 'ml') {
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
  
  // Food portion calculations - extract gram amounts from unit descriptions
  else if (unitLower.includes('250g')) multiplier = quantity * 2.5; // 250g portions (wraps, etc.)
  else if (unitLower.includes('300g')) multiplier = quantity * 3.0; // 300g portions
  else if (unitLower.includes('320g')) multiplier = quantity * 3.2; // 320g portions
  else if (unitLower.includes('450g')) multiplier = quantity * 4.5; // 450g portions (large meals)
  else if (unitLower.includes('200g')) multiplier = quantity * 2; // Large portion
  else if (unitLower.includes('180g')) multiplier = quantity * 1.8; // Large item
  else if (unitLower.includes('150g')) multiplier = quantity * 1.5; // Medium portion
  else if (unitLower.includes('120g')) multiplier = quantity * 1.2; // Medium fruit/item
  else if (unitLower.includes('100g')) multiplier = quantity * 1; // Standard portion
  else if (unitLower.includes('80g')) multiplier = quantity * 0.8; // Small item
  else if (unitLower.includes('50g')) multiplier = quantity * 0.5; // Small portion
  
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
  // Handle plain size descriptors (must come after more specific patterns)
  else if (unitLower === 'small') multiplier = quantity * 0.7;
  else if (unitLower === 'medium') multiplier = quantity * 1.0;
  else if (unitLower === 'large') multiplier = quantity * 1.5;
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
  const isBeverage = category.toLowerCase().includes("beverage") || category.toLowerCase().includes("drink") ||
                   name.includes("juice") || name.includes("tea") || name.includes("coffee") || 
                   name.includes("milk") || name.includes("lassi") || name.includes("shake") ||
                   name.includes("beer") || name.includes("wine") || name.includes("alcohol");

  // Water - should always be 0 calories
  if (name.includes("water")) {
    return {
      unit: "glass (250ml)",
      unitOptions: isBeverage ? ["glass (250ml)", "bottle/big can (500ml)", "liter", "ml"] : ["glass (250ml)", "bottle (500ml)", "liter", "ml"],
    };
  }
  
  // Beer and alcoholic beverages - realistic serving sizes
  if (name.includes("beer") || name.includes("wine") || name.includes("alcohol")) {
    // For Kingfisher beer specifically, default to 500ml can
    if (name.toLowerCase().includes("kingfisher")) {
      return {
        unit: "can (500ml)", 
        unitOptions: ["can (500ml)", "bottle/big can (330ml)", "bottle/big can (650ml)", "pint (568ml)", "glass (250ml)"],
      };
    }
    // For other beers, check if can is mentioned
    if (name.includes("can")) {
      return {
        unit: "can (500ml)",
        unitOptions: ["can (500ml)", "bottle/big can (330ml)", "bottle/big can (650ml)", "pint (568ml)", "glass (250ml)"],
      };
    }
    return {
      unit: "bottle/big can (650ml)",
      unitOptions: ["glass (250ml)", "bottle/big can (330ml)", "bottle/big can (500ml)", "bottle/big can (650ml)", "can (500ml)"],
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
      unitOptions: isBeverage ? ["cup (250ml)", "glass (200ml)", "bottle/big can (500ml)", "small cup (150ml)", "large cup (350ml)"] : ["cup (250ml)", "glass (200ml)", "bottle (500ml)", "small cup (150ml)", "large cup (350ml)"]
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
      unitOptions: ["grams", "small portion (75g)", "medium portion (150g)", "large portion (200g)", "bowl"],
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

  // Session refresh endpoint to help with OAuth popup issues
  app.get("/api/auth/refresh", async (req: any, res) => {
    if (req.user) {
      // Force session save and return user
      req.session.save((err: any) => {
        if (err) {
          console.error("Session refresh error:", err);
          res.status(500).json({ error: "Session refresh failed" });
        } else {
          res.json({ 
            success: true, 
            user: {
              id: req.user.id,
              email: req.user.email,
              firstName: req.user.firstName,
              lastName: req.user.lastName,
              profileImageUrl: req.user.profileImageUrl,
              subscriptionStatus: req.user.subscriptionStatus,
              premiumActivated: req.user.premiumActivatedAt,
            }
          });
        }
      });
    } else {
      res.status(401).json({ message: "No session found" });
    }
  });

  // Auth token validation endpoint for OAuth popup flow
  app.post("/api/auth/validate-token", async (req: any, res) => {
    const { token } = req.body;
    
    if ((req.session as any).tempAuthToken === token && req.user) {
      // Token is valid and user is authenticated, establish main session
      delete (req.session as any).tempAuthToken; // Clean up temp token
      
      req.session.save((err: any) => {
        if (err) {
          console.error("Session validation error:", err);
          res.status(500).json({ error: "Session validation failed" });
        } else {
          res.json({
            success: true,
            user: {
              id: req.user.id,
              email: req.user.email,
              firstName: req.user.firstName,
              lastName: req.user.lastName,
              profileImageUrl: req.user.profileImageUrl,
              subscriptionStatus: req.user.subscriptionStatus,
              premiumActivated: req.user.premiumActivated,
            }
          });
        }
      });
    } else {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  });

  // Alternative session establishment endpoint - directly authenticate by email
  app.post("/api/auth/establish-session", async (req: any, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }
    
    try {
      // Find user by email and establish session
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        // Manually set up the session
        req.session.passport = { user: user.id };
        (req as any).user = user;
        
        req.session.save((err: any) => {
          if (err) {
            console.error("Session establishment error:", err);
            res.status(500).json({ error: "Session establishment failed" });
          } else {
            console.log("Session established for user:", user.email);
            res.json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
                subscriptionStatus: user.subscriptionStatus,
                premiumActivated: user.premiumActivatedAt,
              }
            });
          }
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error establishing session:", error);
      res.status(500).json({ message: "Failed to establish session" });
    }
  });

  // Admin testing route - bypasses all usage limits
  app.post("/api/admin-login", async (req: any, res) => {
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

      // Set admin session manually
      req.session.userId = adminUser.id;
      req.session.isAdmin = true;
      
      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error("Admin session save error:", err);
          return res.status(500).json({ error: "Failed to create admin session" });
        }

        console.log("Admin session created successfully for user:", adminUser.id);
        
        res.json({
          success: true,
          sessionId: adminUser.id,
          message: "Admin access granted with unlimited usage",
          user: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            subscriptionStatus: adminUser.subscriptionStatus,
            premiumActivated: adminUser.premiumActivatedAt,
          }
        });
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

      const {
        smartPortionGrams,
        smartCalories, 
        smartProtein,
        smartCarbs,
        smartFat,
        aiConfidence
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
        smartPortionGrams: smartPortionGrams || null,
        smartCalories: smartCalories || null,
        smartProtein: smartProtein || null,
        smartCarbs: smartCarbs || null,
        smartFat: smartFat || null,
        aiConfidence: aiConfidence || null,
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

  // Unit selection endpoint
  app.get("/api/unit-selection/:foodName", async (req, res) => {
    try {
      const { foodName } = req.params;
      const category = req.query.category as string || "";
      
      // Use the same smart unit selection logic as in search results
      const smartUnits = await getSmartUnitSelection(foodName, category);
      
      // Also return unit options including "grams" and "pieces"
      const unitOptions = [...smartUnits.unitOptions];
      if (!unitOptions.includes("grams")) {
        unitOptions.push("grams");
      }
      if (!unitOptions.includes("pieces")) {
        unitOptions.push("pieces");
      }
      
      res.json({
        unit: smartUnits.unit,
        unitOptions: unitOptions
      });
    } catch (error) {
      console.error("Error getting unit selection:", error);
      // Fallback to local selection if smart selection fails
      const unitSelection = getLocalUnitSelection(foodName, category);
      const unitOptions = [...unitSelection.unitOptions];
      if (!unitOptions.includes("grams")) {
        unitOptions.push("grams");
      }
      if (!unitOptions.includes("pieces")) {
        unitOptions.push("pieces");
      }
      
      res.json({
        unit: unitSelection.unit,
        unitOptions: unitOptions
      });
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
  app.delete("/api/meal/:id", async (req: any, res) => {
    try {
      const id = parseFloat(req.params.id);
      console.log(`DELETE /api/meal/${req.params.id} - Parsed ID:`, id);
      if (isNaN(id)) {
        console.log("Invalid ID provided:", req.params.id);
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      // Helper function to calculate multipliers (same as frontend components)
      function getMultiplier(unit: string, food: any) {
        const unitLower = unit.toLowerCase();
        const name = food.name.toLowerCase();
        
        // Water always has 0 calories regardless of unit or quantity
        if (name.includes("water")) {
          return 0;
        }
        
        // VOLUME-BASED UNITS (for beverages) - Extract ml and calculate based on 100ml base
        const mlMatch = unitLower.match(/(\d+)ml/);
        if (mlMatch) {
          const mlAmount = parseInt(mlMatch[1]);
          return mlAmount / 100; // Base nutrition is per 100ml
        }
        
        // WEIGHT-BASED UNITS (for solid foods) - Extract grams and calculate based on 100g base
        const gMatch = unitLower.match(/(\d+)g\)/);
        if (gMatch) {
          const gAmount = parseInt(gMatch[1]);
          return gAmount / 100; // Base nutrition is per 100g
        }
        
        // NUTS & TRAIL MIXES - Enhanced piece-based calculations
        if (name.match(/\b(nuts|nut|trail|mix|almond|cashew|peanut|walnut|pistachio|mixed nuts)\b/)) {
          if (unitLower.includes("piece")) {
            if (name.includes("cashew")) return 0.015;
            else if (name.includes("almond")) return 0.012;
            else if (name.includes("peanut")) return 0.008;
            else if (name.includes("walnut")) return 0.025;
            else return 0.015;
          }
        }

        // MEAT & PROTEIN - Enhanced piece-based calculations for consistent portioning
        if (name.match(/\b(chicken|mutton|fish|beef|pork|lamb|turkey|duck)\b/) && unitLower.includes("piece")) {
          if (name.includes("chicken")) return 0.8;
          else if (name.includes("fish")) return 1.0;
          else if (name.includes("pork")) return 0.75;
          else if (name.includes("beef")) return 0.9;
          else return 0.75;
        }
        
        const unitMultipliers: Record<string, number> = {
          "serving": 1.0, "piece": 0.8, "slice": 0.6, "cup": 2.4, "glass": 2.5,
          "bowl": 2.0, "bottle": 5.0, "can": 3.3, "small portion": 0.7,
          "medium portion": 1.0, "large portion": 1.5, "handful": 0.3,
          "tablespoon": 0.15, "teaspoon": 0.05, "ml": 0.01, "gram": 0.01, "g": 0.01,
        };
        
        return unitMultipliers[unit] || 1.0;
      }

      // First, get the meal item to know which session and date it belongs to
      const mealItemToRemove = await db.select().from(mealItems).where(eq(mealItems.id, id)).limit(1);
      
      const success = await storage.removeMealItem(id);
      console.log(`Removal result:`, success);
      if (!success) {
        return res.status(404).json({ message: "Meal not found" });
      }

      // If removal was successful and we found the meal item, update the daily summary
      if (mealItemToRemove.length > 0) {
        const removedItem = mealItemToRemove[0];
        const sessionId = removedItem.sessionId;
        const date = removedItem.date || new Date().toISOString().split('T')[0];
        
        console.log(`Updating daily summary for session ${sessionId} on date ${date} after meal removal`);
        
        // Get all remaining meal items for this session and date
        const remainingMealItems = await storage.getMealItems(sessionId, date);
        
        // Get existing daily summary
        const existingSummary = await storage.getDailySummary(sessionId, date);
        
        if (existingSummary) {
          // Calculate new totals from remaining meal items
          const newTotals = remainingMealItems.reduce((acc, item) => {
            const multiplier = getMultiplier(item.unit, item.food);
            const calories = (item.food?.calories || 0) * (item.quantity || 1) * multiplier;
            const protein = (item.food?.protein || 0) * (item.quantity || 1) * multiplier;
            const carbs = (item.food?.carbs || 0) * (item.quantity || 1) * multiplier;
            const fat = (item.food?.fat || 0) * (item.quantity || 1) * multiplier;
            
            return {
              calories: acc.calories + calories,
              protein: acc.protein + protein,
              carbs: acc.carbs + carbs,
              fat: acc.fat + fat
            };
          }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          // Update the daily summary with new totals and meal data
          const updatedSummary = {
            sessionId,
            date,
            totalCalories: Math.round(newTotals.calories * 100) / 100,
            totalProtein: Math.round(newTotals.protein * 100) / 100,
            totalCarbs: Math.round(newTotals.carbs * 100) / 100,
            totalFat: Math.round(newTotals.fat * 100) / 100,
            caloriesBurned: existingSummary.caloriesBurned || 0,
            netCalories: Math.round((newTotals.calories - (existingSummary.caloriesBurned || 0)) * 100) / 100,
            mealData: JSON.stringify(remainingMealItems)
          };
          
          await storage.saveDailySummary(updatedSummary);
          console.log(`Daily summary updated successfully after meal removal`);
        }
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
      
      if (data.weightGoal === "lose") {
        targetCalories = tdee - 500; // 500 calorie deficit for 1lb/week loss
      } else if (data.weightGoal === "gain") {
        targetCalories = tdee + 500; // 500 calorie surplus for 1lb/week gain
      } else if (data.weightGoal === "muscle") {
        targetCalories = tdee + 300; // Moderate surplus for muscle building
      }

      // Simple protein target calculation: 0.8g per kg body weight (default), or use custom value
      const defaultProteinTarget = Math.floor(data.weight * 0.8);
      const dailyProteinTarget = data.targetProtein || defaultProteinTarget;

      const profileData = {
        ...data,
        sessionId: userSessionId,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetProtein: dailyProteinTarget,
        dailyProteinTarget: dailyProteinTarget,
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

      if (!process.env.GEMINI_API_KEY) {
        return res
          .status(400)
          .json({ message: "AI analysis service not available" });
      }

      console.log("Starting food image analysis with Gemini...");

      const imageData = Buffer.from(image, 'base64');
      
      // Step 1: Create image hash for caching
      const imageHash = ImageOptimizer.createImageHash(imageData);
      console.log(`Image hash: ${imageHash}`);
      
      // Step 2: Check cache first to avoid duplicate API calls
      const cachedResult = ImageCache.get(imageHash);
      if (cachedResult) {
        console.log(`Cache hit! Returning cached result for hash: ${imageHash}`);
        return res.json({
          foods: cachedResult.foods,
          suggestions: cachedResult.suggestions,
          cached: true,
          compressionSavings: cachedResult.compressionSavings
        });
      }
      
      // Step 3: Optimize image to reduce API costs
      const optimization = await ImageOptimizer.optimizeForAnalysis(imageData);
      console.log(`Image optimized: ${optimization.originalSize}B → ${optimization.optimizedSize}B (${optimization.savings} saved)`);
      
      const optimizedImageData = optimization.optimizedImage;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              foods: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    confidence: { type: "number" },
                    estimatedQuantity: { type: "string" },
                  },
                  required: ["name", "calories", "protein", "carbs", "fat", "confidence", "estimatedQuantity"],
                },
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["foods", "suggestions"],
          },
        },
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: optimizedImageData.toString("base64"),
                  mimeType: "image/jpeg",
                },
              },
              {
                text: 'Analyze this food image and identify all visible food items. For each food, estimate the actual portion and provide nutritional data per 100g. Return JSON: {"foods": [{"name": "food name", "calories": number (per 100g), "protein": number, "carbs": number, "fat": number, "confidence": number (0-100), "estimatedQuantity": "serving description"}], "suggestions": ["tips or recommendations"]}',
              },
            ],
          },
        ],
      });

      console.log("Gemini analysis complete");
      const result = JSON.parse(response.text || "{}");
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

      // Enhanced validation and normalization with smart portion data
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
          // Extract smart portion data from AI analysis
          smartPortionGrams: food.portionWeightGrams ? Math.round(Number(food.portionWeightGrams) * 10) / 10 : null,
          smartCalories: food.portionCalories ? Math.round(Number(food.portionCalories) * 10) / 10 : null,
          smartProtein: food.portionProtein ? Math.round(Number(food.portionProtein) * 10) / 10 : null,
          smartCarbs: food.portionCarbs ? Math.round(Number(food.portionCarbs) * 10) / 10 : null,
          smartFat: food.portionFat ? Math.round(Number(food.portionFat) * 10) / 10 : null,
          aiConfidence: Math.min(100, Math.max(10, Math.round(Number(food.confidence) || 75))),
        };
        console.log("Validated food with smart portion data:", normalizedFood);
        return normalizedFood;
      });

      console.log(`Successfully analyzed ${validatedFoods.length} food items`);

      // Step 4: Cache the result for future identical images
      const cacheResult = {
        foods: validatedFoods,
        suggestions: result.suggestions || ["Foods detected successfully!"],
        timestamp: Date.now(),
        imageHash,
        compressionSavings: optimization.savings
      };
      ImageCache.set(imageHash, cacheResult);
      console.log(`Result cached for hash: ${imageHash}`);

      res.json({
        foods: validatedFoods,
        suggestions: result.suggestions || ["Foods detected successfully!"],
        compressionSavings: optimization.savings,
        cached: false
      });
    } catch (error) {
      console.error("Food image analysis error:", error);
      res.status(500).json({
        message: "Failed to analyze food image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Image cache statistics for admin monitoring
  app.get("/api/image-cache-stats", async (req, res) => {
    try {
      const stats = ImageCache.getStats();
      res.json({
        cacheSize: stats.size,
        cacheHits: stats.hits,
        cacheMisses: stats.misses,
        hitRate: stats.hits + stats.misses > 0 ? 
          ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%'
      });
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res.status(500).json({ message: "Failed to fetch cache statistics" });
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

      const systemPrompt = "You are a certified nutrition expert providing personalized health insights. Be specific, encouraging, and scientifically accurate.";
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });

      const insights =
        response.text ||
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

        const { planType = "basic", referralCode } = req.body;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        // Validate referral code if provided
        let referralInfluencer = null;
        if (referralCode && referralCode.length === 5) {
          try {
            referralInfluencer = await storage.getInfluencerByReferralCode(referralCode);
            if (!referralInfluencer) {
              return res.status(400).json({ error: "Invalid referral code" });
            }
            console.log(`Valid referral code ${referralCode} for influencer: ${referralInfluencer.name}`);
          } catch (error) {
            console.error("Error validating referral code:", error);
            return res.status(400).json({ error: "Invalid referral code" });
          }
        }

        // Get user details for order
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Get subscription plan pricing from database
        const subscriptionPlan = await storage.getSubscriptionPlan(planType);
        if (!subscriptionPlan) {
          return res.status(400).json({ error: `Invalid plan type: ${planType}` });
        }

        console.log(`Razorpay order creation request - Amount: ₹${subscriptionPlan.priceInPaise/100}, Plan: ${planType}, User: ${userId}`);

        const options = {
          amount: subscriptionPlan.priceInPaise, // amount in paise from database
          currency: subscriptionPlan.currency || "INR",
          receipt: `calonik_${planType}_${Date.now()}`,
          notes: {
            userId: userId,
            userEmail: user.email || "",
            subscription: `${planType}_monthly`,
            plan: planType, // Store plan type for webhook processing
            appName: "Calonik.ai",
            ...(referralInfluencer && { 
              referralCode: referralCode,
              influencerId: referralInfluencer.id,
              influencerName: referralInfluencer.name 
            }),
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
          // Get plan type from order to activate correct subscription
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });

          const order = await razorpay.orders.fetch(razorpay_order_id);
          const planType = order.notes?.plan || 'premium'; // default to premium for safety
          const referralCode = order.notes?.referralCode;
          const influencerId = order.notes?.influencerId;
          
          console.log(`Plan type from order: ${planType} for user: ${userId}`);
          if (referralCode) {
            console.log(`Processing referral: ${referralCode} (Influencer ID: ${influencerId})`);
          }

          // Get subscription plan for commission calculation
          const subscriptionPlan = await storage.getSubscriptionPlan(planType);
          const subscriptionAmount = subscriptionPlan ? subscriptionPlan.priceInPaise / 100 : (planType === 'basic' ? 99 : 399);

          // Activate subscription based on plan type
          let updatedUser;
          let subscriptionType;
          
          if (planType === 'basic') {
            updatedUser = await storage.activateBasicSubscription(
              userId,
              {
                customerId: razorpay_payment_id,
                subscriptionId: razorpay_order_id,
              },
            );
            subscriptionType = 'basic';
          } else {
            updatedUser = await storage.activatePremiumSubscription(
              userId,
              {
                customerId: razorpay_payment_id,
                subscriptionId: razorpay_order_id,
              },
            );
            subscriptionType = 'premium';
          }

          console.log(`${subscriptionType} subscription activated for user: ${userId}`);

          // Grant 2 bonus photo scans immediately upon subscription upgrade
          try {
            // Remove 2 usage entries from today to give immediate extra scans
            const today = new Date().toISOString().split('T')[0];
            const usageEntries = await db.select()
              .from(usageTracking)
              .where(
                and(
                  eq(usageTracking.userId, userId),
                  eq(usageTracking.actionType, "photo_analyze"),
                  eq(usageTracking.date, today)
                )
              )
              .limit(2);
            
            // Delete up to 2 usage entries to give bonus scans
            for (const entry of usageEntries) {
              await db.delete(usageTracking).where(eq(usageTracking.id, entry.id));
            }
            
            console.log(`Granted ${usageEntries.length} bonus photo scans for ${subscriptionType} upgrade - User: ${userId}`);
          } catch (bonusError) {
            console.error("Error granting bonus scans:", bonusError);
            // Don't fail the payment, just log the error
          }

          // Process referral commission if referral code was used
          if (referralCode && influencerId) {
            try {
              const commissionAmount = Math.floor(subscriptionAmount * 0.1); // 10% commission
              
              // Update influencer stats
              await storage.updateInfluencerStats(parseInt(influencerId), subscriptionAmount);
              
              // Create referral record
              await storage.createInfluencerReferral({
                influencerId: parseInt(influencerId),
                userId: userId,
                subscriptionPlan: planType,
                subscriptionAmount: subscriptionAmount,
                commissionAmount: commissionAmount,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
              });
              
              console.log(`Referral processed: ₹${commissionAmount} commission for influencer ${influencerId} from ${referralCode}`);
            } catch (referralError) {
              console.error("Error processing referral commission:", referralError);
              // Don't fail the payment, just log the error
            }
          }

          res.json({
            message: `Payment verified and ${subscriptionType} subscription activated`,
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

            // Get plan type from order notes
            const orderNotes = order.notes || {};
            const planType = orderNotes.plan === 'basic' ? 'basic' : 'premium';
            
            // Activate subscription based on plan type
            let updatedUser;
            if (planType === 'basic') {
              updatedUser = await storage.activateBasicSubscription(
                userId,
                {
                  customerId: paymentId,
                  subscriptionId: orderId,
                },
              );
            } else {
              updatedUser = await storage.activatePremiumSubscription(
                userId,
                {
                  customerId: paymentId,
                  subscriptionId: orderId,
                },
              );
            }

            console.log(`${planType} subscription activated for user ${userId} via webhook`);

            // For webhook, we need to respond to Razorpay but we can't redirect the user directly
            // The frontend payment handler will handle the redirect
            res.status(200).json({
              message: `${planType} subscription activated successfully`,
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
      const subscriptionStatus = user?.subscriptionStatus || "free";
      const isPremium = subscriptionStatus === "premium";
      const isBasic = subscriptionStatus === "basic";

      console.log(
        `Usage stats debug - userId: ${userId}, user found: ${!!user}, subscription: ${subscriptionStatus}, isPremium: ${isPremium}, isBasic: ${isBasic}`,
      );

      const limits = isPremium
        ? { photos: 5, meals: 20 }
        : isBasic
        ? { photos: 2, meals: 5 }
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
        isBasic,
        subscriptionStatus,
      });
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });

  // User Progress Analytics API
  app.get("/api/analytics/user-progress", optionalAuth, async (req: any, res) => {
    try {
      const { sessionId, days = 30 } = req.query;
      const effectiveSessionId = req.user?.id || sessionId;

      if (!effectiveSessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      const daysBack = parseInt(days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Get daily nutrition trends
      const dailyNutrition = await db.select()
        .from(dailySummaries)
        .where(
          and(
            eq(dailySummaries.sessionId, effectiveSessionId),
            sql`${dailySummaries.date} >= ${startDateStr}`
          )
        )
        .orderBy(desc(dailySummaries.date));



      // Get weight progress
      const weightHistory = await db.select()
        .from(dailyWeights)
        .where(
          and(
            eq(dailyWeights.sessionId, effectiveSessionId),
            sql`${dailyWeights.date} >= ${startDateStr}`
          )
        )
        .orderBy(desc(dailyWeights.date));

      // Get exercise history
      const exerciseHistory = await db.select()
        .from(exercises)
        .where(
          and(
            eq(exercises.sessionId, effectiveSessionId),
            sql`${exercises.date} >= ${startDateStr}`
          )
        )
        .orderBy(desc(exercises.date));

      // Get usage patterns
      const usagePatterns = await db.select({
        date: usageTracking.date,
        actionType: usageTracking.actionType,
        count: sql`COUNT(*)`
      })
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, effectiveSessionId),
          sql`${usageTracking.date} >= ${startDateStr}`
        )
      )
      .groupBy(usageTracking.date, usageTracking.actionType)
      .orderBy(desc(usageTracking.date));

      // Calculate progress metrics
      const totalDays = dailyNutrition.length;
      const avgCalories = totalDays > 0 ? 
        Math.round(dailyNutrition.reduce((sum, day) => sum + (day.totalCalories || 0), 0) / totalDays) : 0;
      const avgProtein = totalDays > 0 ? 
        Math.round((dailyNutrition.reduce((sum, day) => sum + (day.totalProtein || 0), 0) / totalDays) * 10) / 10 : 0;
      
      // Weight trend analysis
      let weightTrend = 'stable';
      let totalWeightChange = 0;
      if (weightHistory.length >= 2) {
        const firstWeight = weightHistory[weightHistory.length - 1].weight;
        const lastWeight = weightHistory[0].weight;
        totalWeightChange = Math.round((lastWeight - firstWeight) * 10) / 10;
        if (totalWeightChange > 1) weightTrend = 'increasing';
        else if (totalWeightChange < -1) weightTrend = 'decreasing';
      }

      // Activity consistency
      const activeDays = dailyNutrition.filter(day => day.totalCalories > 0).length;
      const consistencyScore = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

      // Generate insights
      const insights = [
        consistencyScore >= 80 ? "Excellent tracking consistency!" : 
        consistencyScore >= 60 ? "Good tracking habits, keep it up!" : 
        "Consider tracking daily for better insights",
        
        weightTrend === 'decreasing' ? "Great progress on weight loss!" :
        weightTrend === 'increasing' ? "Weight trending upward" :
        "Weight remaining stable",
        
        avgCalories > 0 ? `Averaging ${avgCalories} calories daily` : "Start tracking calories for insights"
      ];

      res.json({
        analytics: {
          dateRange: {
            startDate: startDateStr,
            endDate: new Date().toISOString().split('T')[0],
            totalDays,
            activeDays
          },
          nutritionTrends: {
            avgDailyCalories: avgCalories,
            avgDailyProtein: avgProtein,
            dailyData: dailyNutrition.slice(0, 14)
          },
          weightProgress: {
            trend: weightTrend,
            weightHistory: weightHistory.slice(0, 14),
            totalWeightChange
          },
          exerciseHistory: exerciseHistory.slice(0, 14),
          activityMetrics: {
            consistencyScore,
            activeDays,
            totalDays
          },
          usagePatterns,
          insights
        }
      });

    } catch (error) {
      console.error("Error generating user analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  // Global Analytics Dashboard (Admin-only)
  app.get("/api/analytics/global", async (req: any, res) => {
    try {
      // Check admin authentication
      const isAdminSession = req.user?.uid === "admin_testing_user" || 
                           req.headers['x-admin-key'] === process.env.ADMIN_SECRET;
      
      if (!isAdminSession) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Daily active users
      const dailyActiveUsers = await db.select({
        date: dailySummaries.date,
        activeUsers: sql`COUNT(DISTINCT ${dailySummaries.sessionId})`
      })
      .from(dailySummaries)
      .where(sql`${dailySummaries.date} >= ${startDateStr}`)
      .groupBy(dailySummaries.date)
      .orderBy(desc(dailySummaries.date));

      // User engagement metrics
      const engagementStats = await db.select({
        date: usageTracking.date,
        actionType: usageTracking.actionType,
        totalActions: sql`COUNT(*)`
      })
      .from(usageTracking)
      .where(sql`${usageTracking.date} >= ${startDateStr}`)
      .groupBy(usageTracking.date, usageTracking.actionType)
      .orderBy(desc(usageTracking.date));

      // Subscription breakdown
      const subscriptionStats = await db.select({
        subscriptionStatus: users.subscriptionStatus,
        count: sql`COUNT(*)`
      })
      .from(users)
      .groupBy(users.subscriptionStatus);

      // Total users and growth
      const totalUsers = await db.select({ count: sql`COUNT(*)` }).from(users);
      
      // Recent user registrations
      const recentSignups = await db.select({
        date: sql`DATE(${users.createdAt})`,
        signups: sql`COUNT(*)`
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${startDate}`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt}) DESC`);

      res.json({
        globalAnalytics: {
          overview: {
            totalUsers: totalUsers[0].count,
            dateRange: `${startDateStr} to ${new Date().toISOString().split('T')[0]}`
          },
          userEngagement: {
            dailyActiveUsers,
            engagementStats,
            recentSignups
          },
          subscriptions: subscriptionStats,
          summary: {
            avgDailyActiveUsers: dailyActiveUsers.length > 0 ? 
              Math.round(dailyActiveUsers.reduce((sum, day) => sum + Number(day.activeUsers), 0) / dailyActiveUsers.length) : 0,
            totalPhotoScans: engagementStats
              .filter(stat => stat.actionType === 'photo_analyze')
              .reduce((sum, stat) => sum + Number(stat.totalActions), 0),
            totalMealEntries: engagementStats
              .filter(stat => stat.actionType === 'meal_add')
              .reduce((sum, stat) => sum + Number(stat.totalActions), 0)
          }
        }
      });

    } catch (error) {
      console.error("Error generating global analytics:", error);
      res.status(500).json({ message: "Failed to generate global analytics" });
    }
  });

  // Get daily weight for specific date
  app.get("/api/daily-weight/:sessionId/:date", async (req, res) => {
    try {
      const { sessionId, date } = req.params;
      console.log(`Fetching daily weight for session ${sessionId} on date ${date}`);
      
      // Use authenticated user ID if available, otherwise use session ID
      const effectiveSessionId = req.user?.id || sessionId;
      const dailyWeight = await storage.getDailyWeight(effectiveSessionId, date);
      
      console.log(`Daily weight result:`, dailyWeight);
      res.json(dailyWeight);
    } catch (error) {
      console.error("Error fetching daily weight:", error);
      res.status(500).json({ message: "Failed to fetch daily weight" });
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

  // GET /api/hourly-activities - Get all hourly activities  
  app.get("/api/hourly-activities", async (req, res) => {
    try {
      const activities = await db.select().from(hourlyActivities).orderBy(hourlyActivities.activityNumber);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching hourly activities:", error);
      res.status(500).json({ message: "Failed to fetch hourly activities" });
    }
  });

  // GET /api/hourly-activities/random - Get a random hourly activity
  app.get("/api/hourly-activities/random", async (req, res) => {
    try {
      const activities = await db.select().from(hourlyActivities);
      if (activities.length === 0) {
        return res.status(404).json({ message: "No activities found" });
      }
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      res.json(randomActivity);
    } catch (error) {
      console.error("Error fetching random activity:", error);
      res.status(500).json({ message: "Failed to fetch random activity" });
    }
  });

  // POST /api/test-hourly-nudge - Test hourly nudge for a specific email
  app.post("/api/test-hourly-nudge", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const success = await testHourlyNudge(email, name || 'there');
      
      if (success) {
        res.json({ 
          message: "Hourly nudge test email sent successfully",
          email,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ message: "Failed to send hourly nudge test email" });
      }
    } catch (error) {
      console.error("Error in hourly nudge test:", error);
      res.status(500).json({ 
        message: "Failed to run hourly nudge test", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // ===== INFLUENCER REFERRAL TRACKING API ENDPOINTS =====

  // POST /api/influencers - Create a new influencer
  app.post("/api/influencers", async (req, res) => {
    try {
      const { name, email, phoneNumber } = req.body;
      
      if (!name || !email || !phoneNumber) {
        return res.status(400).json({ message: "Name, email, and phone number are required" });
      }

      const influencer = await storage.createInfluencer({
        name,
        email,
        phoneNumber,
      });

      res.status(201).json(influencer);
    } catch (error) {
      console.error("Error creating influencer:", error);
      res.status(500).json({ message: "Failed to create influencer" });
    }
  });

  // GET /api/influencers - Get all influencers
  app.get("/api/influencers", async (req, res) => {
    try {
      const influencers = await storage.getAllInfluencers();
      res.json(influencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      res.status(500).json({ message: "Failed to fetch influencers" });
    }
  });

  // GET /api/influencers/:referralCode - Get influencer by referral code
  app.get("/api/influencers/:referralCode", async (req, res) => {
    try {
      const { referralCode } = req.params;
      
      if (!referralCode || referralCode.length !== 5) {
        return res.status(400).json({ message: "Valid 5-letter referral code required" });
      }

      const influencer = await storage.getInfluencerByReferralCode(referralCode);
      
      if (!influencer) {
        return res.status(404).json({ message: "Influencer not found" });
      }

      res.json(influencer);
    } catch (error) {
      console.error("Error fetching influencer:", error);
      res.status(500).json({ message: "Failed to fetch influencer" });
    }
  });

  // GET /api/influencers/:influencerId/referrals - Get referrals for an influencer
  app.get("/api/influencers/:influencerId/referrals", async (req, res) => {
    try {
      const { influencerId } = req.params;
      
      if (!influencerId || isNaN(Number(influencerId))) {
        return res.status(400).json({ message: "Valid influencer ID required" });
      }

      const referrals = await storage.getInfluencerReferrals(Number(influencerId));
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching influencer referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // POST /api/influencer-referrals - Create a new influencer referral
  app.post("/api/influencer-referrals", async (req, res) => {
    try {
      const { influencerId, userId, subscriptionAmount, commissionAmount } = req.body;
      
      if (!influencerId || !userId || !subscriptionAmount || !commissionAmount) {
        return res.status(400).json({ 
          message: "Influencer ID, user ID, subscription amount, and commission amount are required" 
        });
      }

      const referral = await storage.createInfluencerReferral({
        influencerId,
        userId,
        subscriptionAmount,
        commissionAmount,
      });

      res.status(201).json(referral);
    } catch (error) {
      console.error("Error creating influencer referral:", error);
      res.status(500).json({ message: "Failed to create referral" });
    }
  });

  // Admin route for usage analytics dashboard
  app.get("/api/admin/usage-analytics", async (req: any, res) => {
    try {
      // Check admin authentication
      const isAdminSession = req.user?.uid === "admin_testing_user" || 
                           req.headers['x-admin-key'] === process.env.ADMIN_SECRET ||
                           (req.session && req.session.userId === "admin_testing_user" && req.session.isAdmin);
      
      if (!isAdminSession) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get comprehensive user usage data
      const userUsageQuery = `
        SELECT 
            u.id as user_id,
            u.email,
            u.first_name,
            u.subscription_status,
            u.subscription_ends_at,
            COALESCE(photo_stats.total_photos, 0) as total_photo_scans,
            COALESCE(meal_stats.total_meals, 0) as total_food_searches,
            COALESCE(photo_stats.recent_photos, 0) as photos_last_7_days,
            COALESCE(meal_stats.recent_meals, 0) as food_searches_last_7_days,
            COALESCE(photo_stats.today_photos, 0) as photos_today,
            COALESCE(meal_stats.today_meals, 0) as food_searches_today,
            u.created_at as user_joined_date
        FROM users u
        LEFT JOIN (
            SELECT 
                user_id,
                SUM(count) as total_photos,
                SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN count ELSE 0 END) as recent_photos,
                SUM(CASE WHEN date = CURRENT_DATE THEN count ELSE 0 END) as today_photos
            FROM usage_tracking 
            WHERE action_type = 'photo_analyze'
            GROUP BY user_id
        ) photo_stats ON u.id = photo_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                SUM(count) as total_meals,
                SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN count ELSE 0 END) as recent_meals,
                SUM(CASE WHEN date = CURRENT_DATE THEN count ELSE 0 END) as today_meals
            FROM usage_tracking 
            WHERE action_type = 'meal_add'
            GROUP BY user_id
        ) meal_stats ON u.id = meal_stats.user_id
        ORDER BY u.created_at DESC
      `;

      const userUsage = await db.execute(sql.raw(userUsageQuery));

      // Get subscription summary
      const subscriptionSummaryQuery = `
        SELECT 
            subscription_status,
            COUNT(*) as total_users,
            SUM(COALESCE(photo_stats.total_photos, 0)) as total_photo_scans_all,
            SUM(COALESCE(meal_stats.total_meals, 0)) as total_food_searches_all,
            ROUND(AVG(COALESCE(photo_stats.total_photos, 0)), 2) as avg_photos_per_user,
            ROUND(AVG(COALESCE(meal_stats.total_meals, 0)), 2) as avg_searches_per_user
        FROM users u
        LEFT JOIN (
            SELECT user_id, SUM(count) as total_photos
            FROM usage_tracking 
            WHERE action_type = 'photo_analyze'
            GROUP BY user_id
        ) photo_stats ON u.id = photo_stats.user_id
        LEFT JOIN (
            SELECT user_id, SUM(count) as total_meals
            FROM usage_tracking 
            WHERE action_type = 'meal_add'
            GROUP BY user_id
        ) meal_stats ON u.id = meal_stats.user_id
        GROUP BY subscription_status
        ORDER BY subscription_status
      `;

      const subscriptionSummary = await db.execute(sql.raw(subscriptionSummaryQuery));

      // Get top 10 most active users
      const topUsersQuery = `
        SELECT 
            u.id as user_id,
            u.email,
            u.first_name,
            u.subscription_status,
            u.subscription_ends_at,
            COALESCE(photo_stats.total_photos, 0) as total_photo_scans,
            COALESCE(meal_stats.total_meals, 0) as total_food_searches,
            COALESCE(photo_stats.recent_photos, 0) as photos_last_7_days,
            COALESCE(meal_stats.recent_meals, 0) as food_searches_last_7_days,
            COALESCE(photo_stats.today_photos, 0) as photos_today,
            COALESCE(meal_stats.today_meals, 0) as food_searches_today,
            u.created_at as user_joined_date,
            COALESCE(photo_stats.total_photos, 0) + COALESCE(meal_stats.total_meals, 0) as total_activity
        FROM users u
        LEFT JOIN (
            SELECT user_id, SUM(count) as total_photos, 
                   SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN count ELSE 0 END) as recent_photos,
                   SUM(CASE WHEN date = CURRENT_DATE THEN count ELSE 0 END) as today_photos
            FROM usage_tracking 
            WHERE action_type = 'photo_analyze'
            GROUP BY user_id
        ) photo_stats ON u.id = photo_stats.user_id
        LEFT JOIN (
            SELECT user_id, SUM(count) as total_meals,
                   SUM(CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN count ELSE 0 END) as recent_meals,
                   SUM(CASE WHEN date = CURRENT_DATE THEN count ELSE 0 END) as today_meals
            FROM usage_tracking 
            WHERE action_type = 'meal_add'
            GROUP BY user_id
        ) meal_stats ON u.id = meal_stats.user_id
        WHERE COALESCE(photo_stats.total_photos, 0) + COALESCE(meal_stats.total_meals, 0) > 0
        ORDER BY total_activity DESC
        LIMIT 10
      `;

      const topUsers = await db.execute(sql.raw(topUsersQuery));

      res.json({
        userUsage: userUsage.rows,
        subscriptionSummary: subscriptionSummary.rows,
        topUsers: topUsers.rows,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error fetching usage analytics:", error);
      res.status(500).json({ error: "Failed to fetch usage analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

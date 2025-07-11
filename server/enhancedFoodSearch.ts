/**
 * Enhanced Food Search System
 * Prioritizes accuracy with standardized nutrition data
 */

import { STANDARD_FOODS, getStandardFood, calculateAccurateNutrition } from './standardFoodDatabase';
import { storage } from './storage';
import type { Food, InsertAiUsageStats } from '@shared/schema';
import { GoogleGenAI } from '@google/genai';

export interface EnhancedFoodResult {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
  defaultUnit: string;
  unitOptions: string[];
  accuracy: 'high' | 'medium' | 'low';
  source: 'standard' | 'database' | 'ai';
  isVerified: boolean;
  realisticCalories?: number;
  gramEquivalent?: string;
  // Pre-loaded AI analysis for smooth unit selection
  aiAnalysis?: {
    enhancedCategory: string;
    smartUnit: string;
    smartQuantity: number;
    unitOptions: string[];
    aiConfidence: number;
  };
}

/**
 * Enhanced food search with accuracy prioritization and AI pre-loading
 */
export async function enhancedFoodSearch(query: string, limit: number = 10, userId?: string): Promise<EnhancedFoodResult[]> {
  const results: EnhancedFoodResult[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  // 1. PRIORITY: Check standardized database first
  const standardResults = STANDARD_FOODS
    .filter(food => 
      food.name.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.split(' ').some(word => 
        food.name.toLowerCase().includes(word) && word.length > 2
      )
    )
    .slice(0, 5);

  for (const standardFood of standardResults) {
    const enhancedResult: EnhancedFoodResult = {
      id: Math.floor(Math.random() * 1000000) + 9000000, // Unique ID for standard foods
      name: standardFood.name,
      calories: standardFood.caloriesPer100g,
      protein: standardFood.proteinPer100g,
      carbs: standardFood.carbsPer100g,
      fat: standardFood.fatPer100g,
      category: standardFood.category,
      defaultUnit: standardFood.defaultUnit,
      unitOptions: standardFood.commonUnits,
      accuracy: 'high',
      source: 'standard',
      isVerified: true
    };

    // Calculate realistic calories for default unit
    const nutrition = calculateAccurateNutrition(standardFood.name, 1, standardFood.defaultUnit);
    enhancedResult.realisticCalories = nutrition.calories;
    enhancedResult.gramEquivalent = `(${nutrition.totalGrams}g)`;

    results.push(enhancedResult);
  }

  // 2. SECONDARY: Search database foods with accuracy scoring and pre-load AI analysis
  try {
    const dbFoods = await storage.searchFoods(query);
    
    for (const dbFood of dbFoods) {
      // Skip if we already have a standard version
      if (results.some(r => 
        r.name.toLowerCase().includes(dbFood.name.toLowerCase().split(' ')[0]) ||
        dbFood.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0])
      )) {
        continue;
      }

      // Score database food accuracy
      const accuracy = scoreFoodAccuracy(dbFood);
      
      const enhancedResult: EnhancedFoodResult = {
        id: dbFood.id,
        name: dbFood.name,
        calories: dbFood.calories,
        protein: dbFood.protein,
        carbs: dbFood.carbs,
        fat: dbFood.fat,
        category: dbFood.category,
        defaultUnit: dbFood.defaultUnit || "serving (100g)",
        unitOptions: getUnitOptionsForFood(dbFood.name, dbFood.category),
        accuracy: accuracy.level,
        source: 'database',
        isVerified: accuracy.score > 0.7
      };

      // Pre-load AI analysis for smooth unit selection (only for top results)
      if (results.length < 3) { // Limit AI pre-loading to top 3 results for performance
        try {
          const aiAnalysis = await preloadAIAnalysis(dbFood.name, userId);
          if (aiAnalysis) {
            console.log(`✨ Pre-loaded AI analysis for ${dbFood.name}: ${aiAnalysis.smartUnit}`);
            enhancedResult.aiAnalysis = aiAnalysis;
            // Update unit options with AI suggestions
            const combinedUnits = [...new Set([...enhancedResult.unitOptions, ...aiAnalysis.unitOptions])];
            enhancedResult.unitOptions = combinedUnits;
            enhancedResult.defaultUnit = aiAnalysis.smartUnit;
          }
        } catch (error) {
          console.log(`AI analysis pre-loading failed for ${dbFood.name}, using fallback`);
        }
      }

      results.push(enhancedResult);
    }
  } catch (error) {
    console.error('Database search error:', error);
  }

  // 3. TIER-3: Gemini AI Fallback for unknown foods
  if (results.length < 3 && query.length > 2) {
    try {
      console.log(`Tier-3 fallback: Using Gemini AI for "${query}" (only ${results.length} results found)`);
      const aiResults = await generateAIFoodResults(query, limit - results.length, userId);
      results.push(...aiResults);
    } catch (error) {
      console.error('Gemini AI search error:', error);
    }
  }

  // 4. Sort by accuracy and relevance
  results.sort((a, b) => {
    // Prioritize accuracy
    const accuracyWeight = { 'high': 3, 'medium': 2, 'low': 1 };
    const aScore = accuracyWeight[a.accuracy];
    const bScore = accuracyWeight[b.accuracy];
    
    if (aScore !== bScore) return bScore - aScore;
    
    // Then by relevance (exact match > partial match)
    const aExact = a.name.toLowerCase() === normalizedQuery ? 1 : 0;
    const bExact = b.name.toLowerCase() === normalizedQuery ? 1 : 0;
    
    if (aExact !== bExact) return bExact - aExact;
    
    // Finally by name length (shorter = more specific)
    return a.name.length - b.name.length;
  });

  return results.slice(0, limit);
}

/**
 * Score food accuracy based on nutrition data patterns
 */
function scoreFoodAccuracy(food: Food): { level: 'high' | 'medium' | 'low', score: number } {
  let score = 0;
  let issues = [];

  // Check for realistic calorie ranges by category
  const categoryRanges: Record<string, { min: number, max: number }> = {
    'Grains': { min: 100, max: 400 },
    'Protein': { min: 100, max: 300 },
    'Dairy': { min: 30, max: 350 },
    'Fruits': { min: 30, max: 100 },
    'Vegetables': { min: 10, max: 80 },
    'Nuts': { min: 500, max: 700 },
    'Beverages': { min: 0, max: 150 },
    'Legumes': { min: 70, max: 150 }
  };

  const range = categoryRanges[food.category] || { min: 0, max: 500 };
  
  if (food.calories >= range.min && food.calories <= range.max) {
    score += 0.3;
  } else {
    issues.push(`Unrealistic calories for ${food.category}: ${food.calories}`);
  }

  // Check macronutrient ratios
  const totalMacros = food.protein + food.carbs + food.fat;
  if (totalMacros > 0 && totalMacros <= 100) {
    score += 0.2;
  } else {
    issues.push('Unrealistic macro ratios');
  }

  // Check for suspicious values
  if (food.calories > 0 && food.protein >= 0 && food.carbs >= 0 && food.fat >= 0) {
    score += 0.2;
  }

  // Bonus for clean, descriptive names
  if (food.name && !food.name.includes('AI Generated') && !food.name.includes('Example')) {
    score += 0.2;
  }

  // Category consistency bonus
  if (food.category && food.category !== 'AI Detected') {
    score += 0.1;
  }

  if (score >= 0.8) return { level: 'high', score };
  if (score >= 0.5) return { level: 'medium', score };
  return { level: 'low', score };
}

/**
 * Get appropriate unit options for a food
 */
function getUnitOptionsForFood(name: string, category: string): string[] {
  const nameLower = name.toLowerCase();
  
  // Check if we have a standard food match
  const standardFood = getStandardFood(name);
  if (standardFood) {
    return standardFood.commonUnits;
  }

  // Category-based unit options
  if (category === 'Beverages' || nameLower.includes('tea') || nameLower.includes('coffee') || 
      nameLower.includes('juice') || nameLower.includes('milk')) {
    return ['100ml', '150ml', '200ml', '250ml', '300ml', 'cup (200ml)', 'cup (250ml)', 'small cup (150ml)', 'mug (300ml)', 'large cup (400ml)', 'shot (30ml)', 'ml'];
  }

  if (category === 'Fruits') {
    return ['50g', '100g', '150g', '200g', 'small (100g)', 'medium (150g)', 'large (200g)', 'slice (50g)'];
  }

  if (category === 'Nuts') {
    return ['piece (1-3g)', '5 pieces', '10 pieces', 'handful (20g)', '25g', '50g'];
  }

  if (category === 'Grains' || nameLower.includes('rice') || nameLower.includes('dal') || 
      nameLower.includes('curry')) {
    return [
      '50g', '75g', '100g', '125g', '150g', '200g', '250g',
      'small bowl (100g)', 'bowl (150g)', 'large bowl (200g)',
      'serving (100g)', 'medium portion (150g)', 'large portion (200g)'
    ];
  }

  if (category === 'Protein' || nameLower.includes('chicken') || nameLower.includes('fish') || 
      nameLower.includes('egg')) {
    return ['50g', '75g', '100g', '125g', '150g', 'small piece (75g)', 'piece (100g)', 'large piece (125g)'];
  }

  // Default comprehensive options
  return [
    '25g', '50g', '75g', '100g', '125g', '150g', '200g', '250g',
    'serving (100g)', 'small portion (75g)', 'medium portion (150g)', 'large portion (200g)'
  ];
}

/**
 * Clean database by removing duplicates and inaccurate entries
 */
export async function cleanFoodDatabase(): Promise<{
  duplicatesRemoved: number;
  inaccurateRemoved: number;
  totalCleaned: number;
}> {
  try {
    const allFoods = await storage.getAllFoods();
    let duplicatesRemoved = 0;
    let inaccurateRemoved = 0;

    // Group foods by similar names
    const foodGroups = new Map<string, Food[]>();
    
    for (const food of allFoods) {
      const normalizedName = food.name.toLowerCase().trim()
        .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical content
        .replace(/\s+/g, ' '); // Normalize spaces
      
      if (!foodGroups.has(normalizedName)) {
        foodGroups.set(normalizedName, []);
      }
      foodGroups.get(normalizedName)!.push(food);
    }

    // Process each group
    for (const [name, foods] of Array.from(foodGroups.entries())) {
      if (foods.length > 1) {
        // Keep the most accurate one
        foods.sort((a: Food, b: Food) => {
          const scoreA = scoreFoodAccuracy(a);
          const scoreB = scoreFoodAccuracy(b);
          return scoreB.score - scoreA.score;
        });

        // Remove duplicates (keep the best one)
        for (let i = 1; i < foods.length; i++) {
          try {
            await storage.removeMealItem(foods[i].id);
            duplicatesRemoved++;
          } catch (error) {
            console.error('Error removing duplicate food:', error);
          }
        }
      }
    }

    return {
      duplicatesRemoved,
      inaccurateRemoved,
      totalCleaned: duplicatesRemoved + inaccurateRemoved
    };
  } catch (error) {
    console.error('Database cleaning error:', error);
    return { duplicatesRemoved: 0, inaccurateRemoved: 0, totalCleaned: 0 };
  }
}

/**
 * Track AI usage for cost monitoring
 */
async function trackAiUsage(
  sessionId: string,
  userId: string | null,
  provider: string,
  model: string,
  requestType: string,
  query: string,
  responseTime: number,
  success: boolean = true,
  errorMessage?: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<void> {
  try {
    const estimatedCost = calculateEstimatedCost(provider, model, inputTokens, outputTokens);
    const today = new Date().toISOString().split('T')[0];
    
    const aiUsageData: InsertAiUsageStats = {
      userId,
      sessionId,
      aiProvider: provider,
      aiModel: model,
      requestType,
      query,
      inputTokens,
      outputTokens,
      estimatedCost,
      responseTime,
      success,
      errorMessage,
      date: today
    };
    
    await storage.trackAiUsage(aiUsageData);
  } catch (error) {
    console.error('Failed to track AI usage:', error);
    // Don't throw - tracking should not interrupt core functionality
  }
}

/**
 * Calculate estimated cost for AI usage
 */
function calculateEstimatedCost(provider: string, model: string, inputTokens?: number, outputTokens?: number): number {
  if (!inputTokens && !outputTokens) return 0;
  
  // Gemini pricing in rupees (approximate)
  if (provider === 'gemini') {
    if (model === 'gemini-1.5-flash') {
      // Gemini 1.5 Flash: ₹0.0008 per 1K input tokens, ₹0.0032 per 1K output tokens
      const inputCost = (inputTokens || 0) * 0.0008 / 1000;
      const outputCost = (outputTokens || 0) * 0.0032 / 1000;
      return inputCost + outputCost;
    }
  }
  
  return 0;
}

/**
 * Estimate token count for text
 */
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * TIER-3: Generate AI food results using Gemini 1.5 Flash
 */
async function generateAIFoodResults(query: string, limit: number, userId?: string): Promise<EnhancedFoodResult[]> {
  const startTime = Date.now();
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const prompt = `Generate ${limit} foods for "${query}":

JSON array format:
[{"name":"Food Name","calories":X,"protein":Y,"carbs":Z,"fat":W,"category":"Snacks","defaultUnit":"piece","smartPortion":"piece (50g)"}]

Categories: Snacks, Grains, Protein, Dairy, Fruits, Vegetables, Beverages, Desserts
Values per 100g. Keep concise.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const responseTime = Date.now() - startTime;
    const responseText = response.text || "";
    console.log(`Gemini AI response for "${query}":`, responseText);
    
    // Estimate tokens for cost tracking
    const inputTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(responseText);
    
    // Track AI usage
    if (userId) {
      await trackAiUsage(
        userId,
        null,
        'gemini',
        'gemini-2.5-flash',
        'food_search',
        query,
        responseTime,
        true,
        undefined,
        inputTokens,
        outputTokens
      );
    }

    // Parse JSON response
    let aiData;
    try {
      // Extract JSON from response (remove any markdown or extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      aiData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', parseError);
      return [];
    }

    if (!Array.isArray(aiData)) {
      console.error('Gemini response is not an array:', aiData);
      return [];
    }

    const results: EnhancedFoodResult[] = [];
    
    for (const item of aiData) {
      if (!item.name || !item.calories) continue;
      
      const enhancedResult: EnhancedFoodResult = {
        id: Math.floor(Math.random() * 1000000) + 8000000, // Unique ID for AI foods
        name: item.name,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        category: item.category || 'Main Course',
        defaultUnit: item.defaultUnit || 'serving (100g)',
        unitOptions: getUnitOptionsForFood(item.name, item.category || 'Main Course'),
        accuracy: 'medium',
        source: 'ai',
        isVerified: false
      };

      // Calculate realistic calories for smart portion
      if (item.smartPortion) {
        const portionGrams = extractGramFromSmartPortion(item.smartPortion);
        if (portionGrams) {
          enhancedResult.realisticCalories = Math.round((item.calories * portionGrams) / 100);
          enhancedResult.gramEquivalent = `(${portionGrams}g)`;
        }
      }

      // Store AI-generated food in database for future use
      try {
        const foodToStore = {
          id: enhancedResult.id,
          name: enhancedResult.name,
          calories: enhancedResult.calories,
          protein: enhancedResult.protein,
          carbs: enhancedResult.carbs,
          fat: enhancedResult.fat,
          portionSize: `${enhancedResult.defaultUnit} (100g)`, // AI foods are per 100g
          category: enhancedResult.category,
          defaultUnit: enhancedResult.defaultUnit,
          smartPortionGrams: enhancedResult.gramEquivalent ? extractGramFromSmartPortion(enhancedResult.gramEquivalent) : 100,
          smartCalories: enhancedResult.realisticCalories || enhancedResult.calories,
          smartProtein: enhancedResult.protein,
          smartCarbs: enhancedResult.carbs,
          smartFat: enhancedResult.fat,
          aiConfidence: 85.0 // High confidence for Gemini-generated foods
        };
        await storage.storeAiFood(foodToStore);
        console.log(`Stored AI food in database: ${enhancedResult.name}`);
      } catch (storeError) {
        console.error(`Failed to store AI food ${enhancedResult.name}:`, storeError);
      }

      results.push(enhancedResult);
    }

    console.log(`Generated ${results.length} AI food results for "${query}"`);
    return results.slice(0, limit);

  } catch (error) {
    console.error('Gemini AI food generation error:', error);
    return [];
  }
}

/**
 * Extract gram amount from smart portion strings like "medium bowl (200g)"
 */
function extractGramFromSmartPortion(portion: string): number | null {
  const gramMatch = portion.match(/\((\d+(?:\.\d+)?)g\)/);
  return gramMatch ? parseFloat(gramMatch[1]) : null;
}

/**
 * Pre-load AI analysis for smooth unit selection during search
 */
async function preloadAIAnalysis(foodName: string, sessionId?: string, userId?: string): Promise<{
  enhancedCategory: string;
  smartUnit: string;
  smartQuantity: number;
  unitOptions: string[];
  aiConfidence: number;
} | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const prompt = `Food: "${foodName}"

Return JSON only:
- enhancedCategory: Category (Snacks/Grains/Protein/Dairy/Fruits/Vegetables/Beverages)
- smartUnit: Best default unit
- smartQuantity: Default quantity (usually 1)
- unitOptions: 3-4 realistic units
- aiConfidence: 0.8-1.0

Keep minimal.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            enhancedCategory: { type: "string" },
            smartUnit: { type: "string" },
            smartQuantity: { type: "number" },
            unitOptions: { 
              type: "array",
              items: { type: "string" }
            },
            aiConfidence: { type: "number" }
          },
          required: ["enhancedCategory", "smartUnit", "smartQuantity", "unitOptions", "aiConfidence"]
        }
      },
      contents: prompt,
    });

    const aiData = JSON.parse(response.text || "{}");
    
    // Track AI usage for cost monitoring
    if (userId) {
      await trackAiUsage(
        userId,
        null,
        'gemini',
        'gemini-2.5-flash',
        'pre_load_unit_analysis',
        foodName,
        100, // Approximate response time
        true,
        undefined,
        estimateTokens(prompt),
        estimateTokens(response.text || "")
      );
    }
    
    return {
      enhancedCategory: aiData.enhancedCategory || "Food",
      smartUnit: aiData.smartUnit || "serving (100g)",
      smartQuantity: aiData.smartQuantity || 1,
      unitOptions: aiData.unitOptions || ["serving (100g)", "grams"],
      aiConfidence: aiData.aiConfidence || 0.8
    };
    
  } catch (error) {
    console.error(`Pre-load AI analysis failed for ${foodName}:`, error);
    return null;
  }
}
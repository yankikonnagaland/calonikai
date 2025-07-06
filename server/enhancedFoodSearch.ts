/**
 * Enhanced Food Search System
 * Prioritizes accuracy with standardized nutrition data
 */

import { STANDARD_FOODS, getStandardFood, calculateAccurateNutrition } from './standardFoodDatabase';
import { storage } from './storage';
import type { Food } from '@shared/schema';

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
}

/**
 * Enhanced food search with accuracy prioritization
 */
export async function enhancedFoodSearch(query: string, limit: number = 10): Promise<EnhancedFoodResult[]> {
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

  // 2. SECONDARY: Search database foods with accuracy scoring
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

      results.push(enhancedResult);
    }
  } catch (error) {
    console.error('Database search error:', error);
  }

  // 3. Sort by accuracy and relevance
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
    return ['100ml', '150ml', '200ml', '240ml', '300ml', 'cup (240ml)', 'glass (200ml)', 'small cup (150ml)'];
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
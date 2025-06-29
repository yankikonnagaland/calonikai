/**
 * Unit to Gram Mapping and Calorie Calculation Logic
 * 
 * This module provides accurate unit-to-gram conversions and calorie calculations
 * based on per-100g nutritional data to prevent inflated calorie numbers.
 */

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SmartPortionData {
  smartPortionGrams?: number;    // AI-detected portion weight (e.g., 25g for handful)
  smartCalories?: number;        // AI-detected calories for that portion
  smartProtein?: number;         // AI-detected protein for that portion
  smartCarbs?: number;           // AI-detected carbs for that portion
  smartFat?: number;             // AI-detected fat for that portion
  aiConfidence?: number;         // Confidence level of AI detection (0-100)
}

export interface CalculatedNutrition extends NutritionData {
  totalGrams: number;
  gramEquivalent: string;
  usedSmartPortion?: boolean;    // Indicates if smart AI data was used
  smartPortionInfo?: string;     // Description of smart portion used
}

// Comprehensive unit-to-gram mapping for accurate calorie calculations
export const unitToGramMap: Record<string, number> = {
  // Basic measurements
  "gram": 1,
  "g": 1,
  "100g": 100,
  "kg": 1000,
  
  // Small portions and pieces
  "piece": 15,           // Small piece (e.g., crouton, small cookie)
  "small piece": 10,     // Very small piece
  "medium piece": 20,    // Medium piece
  "large piece": 35,     // Large piece
  "extra large piece": 50,
  
  // Handfuls and scoops
  "handful": 30,         // Standard handful
  "small handful": 20,   // Small handful
  "large handful": 45,   // Large handful
  "scoop": 25,          // Standard scoop
  "small scoop": 15,    // Small scoop
  "large scoop": 40,    // Large scoop
  
  // Volume-based (converted to typical food weights)
  "cup": 120,           // Standard cup of solid food
  "small cup": 80,      // Small cup
  "large cup": 180,     // Large cup
  "half cup": 60,       // Half cup
  "quarter cup": 30,    // Quarter cup
  
  // Bowl measurements
  "bowl": 150,          // Standard bowl
  "small bowl": 100,    // Small bowl
  "medium bowl": 150,   // Medium bowl
  "large bowl": 225,    // Large bowl
  
  // Serving sizes
  "serving": 100,       // Standard serving (100g)
  "small serving": 75,  // Small serving
  "medium serving": 100,// Medium serving
  "large serving": 150, // Large serving
  "half serving": 50,   // Half serving
  "quarter serving": 25,// Quarter serving
  
  // Tablespoon and teaspoon
  "tablespoon": 15,     // Standard tablespoon
  "tbsp": 15,          // Abbreviation
  "teaspoon": 5,       // Standard teaspoon
  "tsp": 5,            // Abbreviation
  
  // Slice measurements
  "slice": 25,         // Standard slice
  "thin slice": 15,    // Thin slice
  "thick slice": 40,   // Thick slice
  "small slice": 20,   // Small slice
  "medium slice": 25,  // Medium slice
  "large slice": 35,   // Large slice
  
  // Bread-specific
  "roti": 50,          // Standard roti
  "chapati": 50,       // Standard chapati
  "naan": 80,          // Standard naan
  "bread slice": 25,   // Bread slice
  "toast": 25,         // Toast slice
  
  // Rice and grain portions
  "rice portion": 150, // Standard rice portion
  "small rice portion": 100,
  "medium rice portion": 150,
  "large rice portion": 200,
  
  // Liquid conversions (ml to equivalent solid weight)
  "ml": 1,             // 1ml ≈ 1g for most liquids
  "glass": 250,        // Standard glass
  "bottle": 500,       // Standard bottle
  "can": 330,          // Standard can
  "mug": 250,          // Standard mug
};

// Food category specific adjustments
export const getFoodCategoryMultiplier = (foodName: string, unit: string): number => {
  const name = foodName.toLowerCase();
  const unitLower = unit.toLowerCase();
  
  // Nuts and dried fruits are denser
  if (name.match(/\b(almond|cashew|walnut|peanut|raisin|dates|nuts)\b/)) {
    if (unitLower.includes('handful')) return 0.6; // Nuts are denser, smaller handful
    if (unitLower.includes('piece')) return 0.3;   // Individual nuts are small
  }
  
  // Leafy vegetables are lighter
  if (name.match(/\b(lettuce|spinach|cabbage|leafy)\b/)) {
    if (unitLower.includes('cup')) return 0.4;     // Leafy greens are very light
    if (unitLower.includes('handful')) return 0.3;
  }
  
  // Chips and crispy snacks are lighter
  if (name.match(/\b(chips|crisps|crackers|biscuit)\b/)) {
    if (unitLower.includes('piece')) return 0.4;   // Individual chips are light
    if (unitLower.includes('handful')) return 0.7; // Handful of chips is lighter
  }
  
  // Fruits have varying densities
  if (name.match(/\b(apple|orange|banana|mango)\b/)) {
    if (unitLower.includes('piece')) {
      if (name.includes('apple') || name.includes('orange')) return 7.0;  // ~180g
      if (name.includes('banana')) return 4.8;                           // ~120g
      if (name.includes('mango')) return 8.0;                            // ~200g
    }
  }
  
  // Beverages (ml to g conversion)
  if (name.match(/\b(tea|coffee|juice|water|milk|beer|wine)\b/)) {
    return 1.0; // 1ml ≈ 1g for liquids
  }
  
  return 1.0; // Default multiplier
};

// Extract gram amount from unit description (e.g., "medium portion (150g)" -> 150)
export const extractGramFromUnit = (unit: string): number | null => {
  const gramMatch = unit.match(/\((\d+)g\)/);
  if (gramMatch) {
    return parseInt(gramMatch[1]);
  }
  
  const mlMatch = unit.match(/\((\d+)ml\)/);
  if (mlMatch) {
    return parseInt(mlMatch[1]); // 1ml ≈ 1g for most liquids
  }
  
  return null;
};

/**
 * Calculate accurate nutrition based on unit and quantity
 * Prioritizes AI-detected smart portion data when available
 */
export const calculateNutritionFromUnit = (
  foodName: string,
  unit: string,
  quantity: number,
  basePer100g: NutritionData,
  smartPortion?: SmartPortionData
): CalculatedNutrition => {
  // Priority 1: Use AI-detected smart portion data if available
  if (smartPortion?.smartPortionGrams && smartPortion?.smartCalories) {
    const unitWeight = unitToGramMap[unit.toLowerCase()] || unitToGramMap["serving"];
    const totalGrams = unitWeight * quantity;
    
    // Calculate calories per gram from AI data
    const calPerGram = smartPortion.smartCalories / smartPortion.smartPortionGrams;
    
    // Scale nutrition based on user's actual selection
    const calories = Math.round(calPerGram * totalGrams * 10) / 10;
    const protein = smartPortion.smartProtein ? Math.round((smartPortion.smartProtein / smartPortion.smartPortionGrams) * totalGrams * 10) / 10 : Math.round(basePer100g.protein * (totalGrams / 100) * 10) / 10;
    const carbs = smartPortion.smartCarbs ? Math.round((smartPortion.smartCarbs / smartPortion.smartPortionGrams) * totalGrams * 10) / 10 : Math.round(basePer100g.carbs * (totalGrams / 100) * 10) / 10;
    const fat = smartPortion.smartFat ? Math.round((smartPortion.smartFat / smartPortion.smartPortionGrams) * totalGrams * 10) / 10 : Math.round(basePer100g.fat * (totalGrams / 100) * 10) / 10;
    
    return {
      calories,
      protein,
      carbs,
      fat,
      totalGrams,
      gramEquivalent: `~${totalGrams}g`,
      usedSmartPortion: true,
      smartPortionInfo: `AI detected: ${smartPortion.smartPortionGrams}g = ${smartPortion.smartCalories} cal`
    };
  }
  
  // Priority 2: Extract grams from unit description
  const extractedGrams = extractGramFromUnit(unit);
  
  let gramsPerUnit: number;
  
  if (extractedGrams) {
    // Use extracted gram amount from unit description
    gramsPerUnit = extractedGrams;
  } else {
    // Use mapping table with food category adjustments
    const baseGrams = unitToGramMap[unit.toLowerCase()] || unitToGramMap["serving"];
    const categoryMultiplier = getFoodCategoryMultiplier(foodName, unit);
    gramsPerUnit = baseGrams * categoryMultiplier;
  }
  
  // Calculate total grams
  const totalGrams = gramsPerUnit * quantity;
  
  // Calculate nutrition per 100g ratio
  const ratio = totalGrams / 100;
  
  // Calculate actual nutrition values
  const calories = Math.round(basePer100g.calories * ratio * 10) / 10;
  const protein = Math.round(basePer100g.protein * ratio * 10) / 10;
  const carbs = Math.round(basePer100g.carbs * ratio * 10) / 10;
  const fat = Math.round(basePer100g.fat * ratio * 10) / 10;
  
  // Create gram equivalent string for transparency
  const gramEquivalent = totalGrams < 1 
    ? `~${Math.round(totalGrams * 10) / 10}g`
    : `~${Math.round(totalGrams)}g`;
  
  return {
    calories,
    protein,
    carbs,
    fat,
    totalGrams: Math.round(totalGrams * 10) / 10,
    gramEquivalent,
    usedSmartPortion: false
  };
};

/**
 * Format nutrition display with gram equivalent
 */
export const formatNutritionDisplay = (
  quantity: number,
  unit: string,
  nutrition: CalculatedNutrition
): string => {
  const quantityText = quantity === 1 ? "1" : quantity.toString();
  const unitText = quantity === 1 ? unit : unit;
  
  return `${quantityText} ${unitText} (${nutrition.gramEquivalent}) = ${nutrition.calories} cal`;
};

/**
 * Validate if calculated calories seem reasonable
 */
export const validateCalorieCalculation = (
  foodName: string,
  calculatedCalories: number,
  totalGrams: number
): { isValid: boolean; warning?: string } => {
  const caloriesPerGram = calculatedCalories / totalGrams;
  
  // Typical calorie ranges per gram
  const ranges = {
    vegetables: { min: 0.1, max: 0.8 },   // 10-80 cal per 100g
    fruits: { min: 0.2, max: 1.0 },       // 20-100 cal per 100g
    grains: { min: 1.0, max: 4.0 },       // 100-400 cal per 100g
    nuts: { min: 4.0, max: 7.0 },         // 400-700 cal per 100g
    oils: { min: 8.0, max: 9.5 },         // 800-950 cal per 100g
    beverages: { min: 0.0, max: 1.5 },    // 0-150 cal per 100g
  };
  
  const name = foodName.toLowerCase();
  let expectedRange = ranges.grains; // Default
  
  if (name.match(/\b(vegetable|lettuce|spinach|cabbage|carrot|onion)\b/)) {
    expectedRange = ranges.vegetables;
  } else if (name.match(/\b(fruit|apple|banana|orange|mango)\b/)) {
    expectedRange = ranges.fruits;
  } else if (name.match(/\b(almond|cashew|walnut|peanut|nuts)\b/)) {
    expectedRange = ranges.nuts;
  } else if (name.match(/\b(oil|butter|ghee)\b/)) {
    expectedRange = ranges.oils;
  } else if (name.match(/\b(tea|coffee|juice|water|milk|beer|wine)\b/)) {
    expectedRange = ranges.beverages;
  }
  
  if (caloriesPerGram < expectedRange.min) {
    return {
      isValid: false,
      warning: `Calories seem too low (${Math.round(caloriesPerGram * 100)} cal/100g). Expected ${Math.round(expectedRange.min * 100)}-${Math.round(expectedRange.max * 100)} cal/100g.`
    };
  }
  
  if (caloriesPerGram > expectedRange.max) {
    return {
      isValid: false,
      warning: `Calories seem too high (${Math.round(caloriesPerGram * 100)} cal/100g). Expected ${Math.round(expectedRange.min * 100)}-${Math.round(expectedRange.max * 100)} cal/100g.`
    };
  }
  
  return { isValid: true };
};
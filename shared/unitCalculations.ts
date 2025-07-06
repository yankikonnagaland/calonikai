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
  "grams": 1,
  "gram": 1,
  "g": 1,
  "100g": 100,
  "kg": 1000,
  
  // Small portions and pieces
  "piece": 15,           // Small piece (e.g., crouton, small cookie)
  "pieces": 15,          // Plural form
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
  
  // Traditional Indian Bowl measurements (based on Healthify standards)
  "bowl": 150,        // Standard bowl (150ml) - most common Indian serving bowl
  "small bowl": 110,  // Small bowl (110ml) - traditional household size
  "medium bowl": 150, // Medium bowl (150ml) - standard serving
  "large bowl": 200,  // Large bowl (200ml) - larger portion
  "extra large bowl": 250, // Extra large bowl (250ml)
  
  // Traditional bowl measurements variants
  "standard bowl": 150, // Standard bowl (alternate naming)
  "regular bowl": 150,  // Regular bowl
  
  // Traditional Indian serving measurements
  "thali portion": 100, // Individual thali item portion
  "dal portion": 150,   // Standard dal serving (1 bowl)
  "curry portion": 120, // Standard curry serving
  "sabzi portion": 100, // Standard vegetable portion
  "chapati portion": 50, // Single chapati/roti
  
  // Serving sizes
  "serving": 100,       // Standard serving (100g)
  "small serving": 75,  // Small serving
  "medium serving": 100,// Medium serving
  "large serving": 150, // Large serving
  "half serving": 50,   // Half serving
  "quarter serving": 25,// Quarter serving
  
  // Portion sizes
  "portion": 100,       // Standard portion (100g)
  "small portion": 75,  // Small portion (75g)
  "medium portion": 150,// Medium portion (150g)
  "large portion": 200, // Large portion (200g)
  "extra large portion": 250, // Extra large portion (250g)
  
  // Tablespoon and teaspoon
  "tablespoon": 15,     // Standard tablespoon
  "tbsp": 15,          // Abbreviation
  "teaspoon": 5,       // Standard teaspoon
  "tsp": 5,            // Abbreviation
  
  // Slice measurements
  "slice": 25,         // Standard slice (bread)
  "thin slice": 15,    // Thin slice
  "thick slice": 40,   // Thick slice
  "small slice": 20,   // Small slice
  "medium slice": 25,  // Medium slice
  "large slice": 35,   // Large slice
  
  // Cake-specific slice measurements (realistic portions for 180-250 cal range)
  "slice (45g)": 45,   // Small cake slice (~200 cal for banana cake)
  "slice (60g)": 60,   // Standard cake slice (~210-250 cal range)
  "slice (80g)": 80,   // Large cake slice (~280-320 cal range)
  "small slice (45g)": 45,  // Small cake slice
  "large slice (80g)": 80,  // Large cake slice
  
  // Bread-specific
  "roti": 50,          // Standard roti
  "chapati": 50,       // Standard chapati
  "naan": 80,          // Standard naan
  "bread slice": 25,   // Bread slice
  "toast": 25,         // Toast slice
  
  // Rice and grain portions (removed duplicate)
  "small rice portion": 100,
  "medium rice portion": 150,
  "large rice portion": 200,
  
  // Additional Indian measurements (inspired by Healthify standards)
  "half bowl": 75,      // Half bowl portion
  "quarter bowl": 37,   // Quarter bowl portion  
  "double bowl": 300,   // Double bowl serving
  
  // Precise volume-based Indian measurements
  "glass (250ml)": 250, // Standard glass
  "small glass (200ml)": 200, // Small glass
  "large glass (300ml)": 300, // Large glass
  "cup (240ml)": 240,   // Standard cup
  "small cup (150ml)": 150, // Small cup
  "large cup (350ml)": 350, // Large cup
  
  // Beverage specific measurements
  "tea cup": 150,       // Traditional tea cup
  "coffee mug": 240,    // Coffee mug
  "lassi glass": 200,   // Traditional lassi glass
  
  // Traditional Indian bread measurements
  "single roti": 50,    // Single roti/chapati
  "2 rotis": 100,       // 2 rotis
  "3 rotis": 150,       // 3 rotis
  "single naan": 80,    // Single naan
  "paratha": 70,        // Single paratha
  "dosa": 100,          // Single dosa
  "idli": 30,           // Single idli
  "2 idlis": 60,        // 2 idlis
  "3 idlis": 90,        // 3 idlis
  
  // Visual portion guides (based on Healthify visual guides)
  "tennis ball size": 100, // Fruit portion guide
  "closed fist": 100,      // Vegetable portion guide
  "palm size": 85,         // Protein portion guide
  "thumb size": 30,        // Fat/oil portion guide
  
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
  
  // Nuts and dried fruits - specific weights per piece
  if (name.match(/\b(almond|cashew|walnut|peanut|raisin|dates|nuts)\b/)) {
    if (unitLower.includes('handful')) return 2.0; // ~30g handful for nuts
    if (unitLower.includes('piece') || unitLower === 'pieces') {
      // Specific weights for different nuts per piece
      if (name.includes('almond')) return 0.08; // ~1.2g per almond
      if (name.includes('cashew')) return 0.11; // ~1.7g per cashew
      if (name.includes('walnut')) return 0.17; // ~2.5g per walnut half
      if (name.includes('peanut')) return 0.06; // ~0.9g per peanut
      return 0.08; // Default nut weight ~1.2g
    }
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

// Extract gram amount from unit description (e.g., "medium portion (150g)" -> 150, "(250g)" -> 250)
export const extractGramFromUnit = (unit: string): number | null => {
  // Match patterns like "(250g)", "medium portion (150g)", "serving (100g)"
  const gramMatch = unit.match(/\((\d+(?:\.\d+)?)g\)/);
  if (gramMatch) {
    return parseFloat(gramMatch[1]);
  }
  
  // Match patterns like "(250ml)", "glass (250ml)"
  const mlMatch = unit.match(/\((\d+(?:\.\d+)?)ml\)/);
  if (mlMatch) {
    return parseFloat(mlMatch[1]); // 1ml ≈ 1g for most liquids
  }
  
  // Match standalone gram amounts at the beginning (e.g., "250g serving")
  const standaloneGramMatch = unit.match(/^(\d+(?:\.\d+)?)g\b/);
  if (standaloneGramMatch) {
    return parseFloat(standaloneGramMatch[1]);
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
    // For quantity = 1, use AI-detected values directly
    // For quantity > 1, scale proportionally
    const calories = smartPortion.smartCalories * quantity;
    const protein = smartPortion.smartProtein ? smartPortion.smartProtein * quantity : Math.round(basePer100g.protein * (smartPortion.smartPortionGrams / 100) * quantity * 10) / 10;
    const carbs = smartPortion.smartCarbs ? smartPortion.smartCarbs * quantity : Math.round(basePer100g.carbs * (smartPortion.smartPortionGrams / 100) * quantity * 10) / 10;
    const fat = smartPortion.smartFat ? smartPortion.smartFat * quantity : Math.round(basePer100g.fat * (smartPortion.smartPortionGrams / 100) * quantity * 10) / 10;
    const totalGrams = smartPortion.smartPortionGrams * quantity;
    
    return {
      calories: Math.round(calories * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      totalGrams,
      gramEquivalent: `${smartPortion.smartPortionGrams}g`,
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
    const unitLower = unit.toLowerCase();
    const baseGrams = unitToGramMap[unitLower] || unitToGramMap["serving"];
    const categoryMultiplier = getFoodCategoryMultiplier(foodName, unit);
    gramsPerUnit = baseGrams * categoryMultiplier;
    
    // Debug logging for portion size verification
    console.log(`Unit calculation for ${foodName}:`, {
      unit: unitLower,
      baseGrams,
      categoryMultiplier,
      finalGramsPerUnit: gramsPerUnit,
      quantity,
      totalGrams: gramsPerUnit * quantity
    });
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
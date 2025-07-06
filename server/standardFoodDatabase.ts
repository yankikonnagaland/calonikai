/**
 * Standardized Food Nutrition Database
 * Accurate calorie and nutrition values per 100g for Indian foods
 * Sources: USDA, ICMR, verified nutrition databases
 */

export interface StandardFood {
  name: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultUnit: string;
  commonUnits: string[];
  isLiquid: boolean;
}

export const STANDARD_FOODS: StandardFood[] = [
  // GRAINS & CEREALS
  {
    name: "Rice (Cooked)",
    category: "Grains",
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3,
    defaultUnit: "bowl (150g)",
    commonUnits: ["50g", "100g", "150g", "200g", "bowl (150g)", "cup (185g)"],
    isLiquid: false
  },
  {
    name: "Basmati Rice (Cooked)",
    category: "Grains", 
    caloriesPer100g: 121,
    proteinPer100g: 2.5,
    carbsPer100g: 25,
    fatPer100g: 0.2,
    defaultUnit: "bowl (150g)",
    commonUnits: ["50g", "100g", "150g", "200g", "bowl (150g)", "cup (185g)"],
    isLiquid: false
  },
  {
    name: "Brown Rice (Cooked)",
    category: "Grains",
    caloriesPer100g: 111,
    proteinPer100g: 2.3,
    carbsPer100g: 23,
    fatPer100g: 0.9,
    defaultUnit: "bowl (150g)",
    commonUnits: ["50g", "100g", "150g", "200g", "bowl (150g)", "cup (185g)"],
    isLiquid: false
  },

  // LEGUMES & LENTILS
  {
    name: "Dal (Cooked Lentils)",
    category: "Legumes",
    caloriesPer100g: 85,
    proteinPer100g: 5.5,
    carbsPer100g: 14,
    fatPer100g: 0.9,
    defaultUnit: "bowl (150g)",
    commonUnits: ["50g", "75g", "100g", "125g", "150g", "200g", "bowl (150g)", "small bowl (100g)"],
    isLiquid: false
  },
  {
    name: "Moong Dal (Cooked)",
    category: "Legumes",
    caloriesPer100g: 82,
    proteinPer100g: 5.2,
    carbsPer100g: 13.8,
    fatPer100g: 0.8,
    defaultUnit: "bowl (150g)",
    commonUnits: ["50g", "75g", "100g", "125g", "150g", "200g", "bowl (150g)", "small bowl (100g)"],
    isLiquid: false
  },
  {
    name: "Toor Dal (Cooked)",
    category: "Legumes",
    caloriesPer100g: 87,
    proteinPer100g: 5.8,
    carbsPer100g: 14.2,
    fatPer100g: 1.0,
    defaultUnit: "bowl (150g)",
    commonUnits: ["50g", "75g", "100g", "125g", "150g", "200g", "bowl (150g)", "small bowl (100g)"],
    isLiquid: false
  },

  // PROTEINS
  {
    name: "Chicken Breast (Cooked)",
    category: "Protein",
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    defaultUnit: "piece (100g)",
    commonUnits: ["50g", "75g", "100g", "125g", "150g", "piece (100g)", "small piece (75g)"],
    isLiquid: false
  },
  {
    name: "Chicken Curry",
    category: "Protein",
    caloriesPer100g: 180,
    proteinPer100g: 20,
    carbsPer100g: 5,
    fatPer100g: 10,
    defaultUnit: "serving (150g)",
    commonUnits: ["100g", "150g", "200g", "serving (150g)", "bowl (200g)"],
    isLiquid: false
  },
  {
    name: "Fish (Cooked)",
    category: "Protein",
    caloriesPer100g: 136,
    proteinPer100g: 25,
    carbsPer100g: 0,
    fatPer100g: 4.5,
    defaultUnit: "piece (100g)",
    commonUnits: ["75g", "100g", "125g", "150g", "piece (100g)", "fillet (125g)"],
    isLiquid: false
  },
  {
    name: "Egg (Whole)",
    category: "Protein",
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11,
    defaultUnit: "piece (50g)",
    commonUnits: ["piece (50g)", "2 pieces (100g)"],
    isLiquid: false
  },

  // VEGETABLES
  {
    name: "Potato (Cooked)",
    category: "Vegetables",
    caloriesPer100g: 87,
    proteinPer100g: 1.9,
    carbsPer100g: 20,
    fatPer100g: 0.1,
    defaultUnit: "medium (150g)",
    commonUnits: ["100g", "150g", "200g", "small (100g)", "medium (150g)", "large (200g)"],
    isLiquid: false
  },
  {
    name: "Onion",
    category: "Vegetables",
    caloriesPer100g: 40,
    proteinPer100g: 1.1,
    carbsPer100g: 9.3,
    fatPer100g: 0.1,
    defaultUnit: "medium (100g)",
    commonUnits: ["50g", "100g", "150g", "small (60g)", "medium (100g)", "large (150g)"],
    isLiquid: false
  },
  {
    name: "Tomato",
    category: "Vegetables",
    caloriesPer100g: 18,
    proteinPer100g: 0.9,
    carbsPer100g: 3.9,
    fatPer100g: 0.2,
    defaultUnit: "medium (120g)",
    commonUnits: ["100g", "120g", "150g", "small (80g)", "medium (120g)", "large (150g)"],
    isLiquid: false
  },

  // FRUITS
  {
    name: "Apple",
    category: "Fruits",
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 14,
    fatPer100g: 0.2,
    defaultUnit: "medium (180g)",
    commonUnits: ["100g", "180g", "small (150g)", "medium (180g)", "large (200g)"],
    isLiquid: false
  },
  {
    name: "Banana",
    category: "Fruits",
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    fatPer100g: 0.3,
    defaultUnit: "medium (120g)",
    commonUnits: ["100g", "120g", "small (90g)", "medium (120g)", "large (150g)"],
    isLiquid: false
  },
  {
    name: "Mango",
    category: "Fruits",
    caloriesPer100g: 60,
    proteinPer100g: 0.8,
    carbsPer100g: 15,
    fatPer100g: 0.4,
    defaultUnit: "medium (200g)",
    commonUnits: ["100g", "200g", "slice (50g)", "medium (200g)", "large (300g)"],
    isLiquid: false
  },

  // DAIRY
  {
    name: "Whole Milk",
    category: "Dairy",
    caloriesPer100g: 42,
    proteinPer100g: 3.4,
    carbsPer100g: 4.8,
    fatPer100g: 1.0,
    defaultUnit: "cup (240ml)",
    commonUnits: ["100ml", "200ml", "240ml", "cup (240ml)", "glass (200ml)"],
    isLiquid: true
  },
  {
    name: "Yogurt (Plain)",
    category: "Dairy",
    caloriesPer100g: 59,
    proteinPer100g: 10,
    carbsPer100g: 3.6,
    fatPer100g: 0.4,
    defaultUnit: "cup (240g)",
    commonUnits: ["100g", "150g", "240g", "cup (240g)", "small cup (150g)"],
    isLiquid: false
  },
  {
    name: "Paneer",
    category: "Dairy",
    caloriesPer100g: 296,
    proteinPer100g: 25,
    carbsPer100g: 1.2,
    fatPer100g: 20,
    defaultUnit: "piece (50g)",
    commonUnits: ["25g", "50g", "75g", "100g", "piece (50g)", "cube (25g)"],
    isLiquid: false
  },

  // BEVERAGES
  {
    name: "Tea (with milk and sugar)",
    category: "Beverages",
    caloriesPer100g: 60,
    proteinPer100g: 1.5,
    carbsPer100g: 12,
    fatPer100g: 1.0,
    defaultUnit: "cup (240ml)",
    commonUnits: ["150ml", "200ml", "240ml", "cup (240ml)", "small cup (150ml)"],
    isLiquid: true
  },
  {
    name: "Coffee (with milk and sugar)",
    category: "Beverages",
    caloriesPer100g: 65,
    proteinPer100g: 1.8,
    carbsPer100g: 13,
    fatPer100g: 1.2,
    defaultUnit: "cup (240ml)",
    commonUnits: ["150ml", "200ml", "240ml", "cup (240ml)", "small cup (150ml)"],
    isLiquid: true
  },
  {
    name: "Coca Cola",
    category: "Beverages",
    caloriesPer100g: 42,
    proteinPer100g: 0,
    carbsPer100g: 10.6,
    fatPer100g: 0,
    defaultUnit: "can (330ml)",
    commonUnits: ["200ml", "330ml", "500ml", "can (330ml)", "bottle (500ml)", "glass (200ml)"],
    isLiquid: true
  },
  {
    name: "Beer",
    category: "Beverages",
    caloriesPer100g: 43,
    proteinPer100g: 0.5,
    carbsPer100g: 3.6,
    fatPer100g: 0,
    defaultUnit: "bottle (650ml)",
    commonUnits: ["330ml", "500ml", "650ml", "can (330ml)", "bottle (650ml)", "pint (500ml)"],
    isLiquid: true
  },

  // BREADS & ROTI
  {
    name: "Chapati/Roti",
    category: "Grains",
    caloriesPer100g: 297,
    proteinPer100g: 9.6,
    carbsPer100g: 58,
    fatPer100g: 3.7,
    defaultUnit: "piece (50g)",
    commonUnits: ["piece (50g)", "2 pieces (100g)", "3 pieces (150g)"],
    isLiquid: false
  },
  {
    name: "Naan",
    category: "Grains",
    caloriesPer100g: 310,
    proteinPer100g: 8.7,
    carbsPer100g: 56,
    fatPer100g: 5.4,
    defaultUnit: "piece (80g)",
    commonUnits: ["piece (80g)", "half piece (40g)", "large piece (100g)"],
    isLiquid: false
  },
  {
    name: "White Bread",
    category: "Grains",
    caloriesPer100g: 265,
    proteinPer100g: 9,
    carbsPer100g: 49,
    fatPer100g: 3.2,
    defaultUnit: "slice (30g)",
    commonUnits: ["slice (30g)", "2 slices (60g)", "3 slices (90g)"],
    isLiquid: false
  },

  // NUTS & SEEDS
  {
    name: "Almonds",
    category: "Nuts",
    caloriesPer100g: 579,
    proteinPer100g: 21.2,
    carbsPer100g: 21.6,
    fatPer100g: 49.9,
    defaultUnit: "10 pieces (12g)",
    commonUnits: ["piece (1.2g)", "5 pieces (6g)", "10 pieces (12g)", "handful (20g)"],
    isLiquid: false
  },
  {
    name: "Cashews",
    category: "Nuts",
    caloriesPer100g: 553,
    proteinPer100g: 18.2,
    carbsPer100g: 30.2,
    fatPer100g: 43.8,
    defaultUnit: "10 pieces (17g)",
    commonUnits: ["piece (1.7g)", "5 pieces (8.5g)", "10 pieces (17g)", "handful (25g)"],
    isLiquid: false
  },
  {
    name: "Walnuts",
    category: "Nuts",
    caloriesPer100g: 654,
    proteinPer100g: 15.2,
    carbsPer100g: 13.7,
    fatPer100g: 65.2,
    defaultUnit: "5 pieces (12.5g)",
    commonUnits: ["piece (2.5g)", "3 pieces (7.5g)", "5 pieces (12.5g)", "handful (20g)"],
    isLiquid: false
  }
];

/**
 * Get standardized nutrition data for a food
 */
export function getStandardFood(foodName: string): StandardFood | null {
  const normalizedName = foodName.toLowerCase().trim();
  
  return STANDARD_FOODS.find(food => 
    food.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(food.name.toLowerCase().split(' ')[0])
  ) || null;
}

/**
 * Calculate accurate nutrition based on standard database
 */
export function calculateAccurateNutrition(
  foodName: string,
  quantity: number,
  unit: string
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  totalGrams: number;
  accuracy: 'high' | 'medium' | 'low';
  source: 'standard' | 'database' | 'estimated';
} {
  const standardFood = getStandardFood(foodName);
  
  if (standardFood) {
    // Extract gram weight from unit
    const gramsMatch = unit.match(/(\d+(?:\.\d+)?)\s*g/);
    const mlMatch = unit.match(/(\d+(?:\.\d+)?)\s*ml/);
    
    let totalGrams = 0;
    
    if (gramsMatch) {
      totalGrams = parseFloat(gramsMatch[1]) * quantity;
    } else if (mlMatch && standardFood.isLiquid) {
      totalGrams = parseFloat(mlMatch[1]) * quantity; // For liquids, ml ≈ g
    } else {
      // Fallback to unit mapping
      const unitLower = unit.toLowerCase();
      if (unitLower.includes('piece')) {
        totalGrams = quantity * 50; // Default piece weight
      } else if (unitLower.includes('cup')) {
        totalGrams = quantity * 240; // Default cup weight
      } else if (unitLower.includes('bowl')) {
        totalGrams = quantity * 150; // Default bowl weight
      } else {
        totalGrams = quantity * 100; // Default serving
      }
    }
    
    const ratio = totalGrams / 100;
    
    return {
      calories: Math.round(standardFood.caloriesPer100g * ratio * 10) / 10,
      protein: Math.round(standardFood.proteinPer100g * ratio * 10) / 10,
      carbs: Math.round(standardFood.carbsPer100g * ratio * 10) / 10,
      fat: Math.round(standardFood.fatPer100g * ratio * 10) / 10,
      totalGrams: Math.round(totalGrams * 10) / 10,
      accuracy: 'high',
      source: 'standard'
    };
  }
  
  // Fallback to existing calculation
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    totalGrams: 0,
    accuracy: 'low',
    source: 'estimated'
  };
}
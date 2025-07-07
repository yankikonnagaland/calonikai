/**
 * Smart Food Portioning and Nutrition Logic Engine for Calonik.ai
 * 
 * This engine provides intelligent portion size recommendations and accurate
 * calorie/macro calculations based on Indian food defaults and cultural eating patterns.
 */

export interface NutritionInput {
  item_name: string;
  base_calories_per_100g_or_100ml: number;
  base_macros_per_100g_or_100ml: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface NutritionOutput {
  recommended_unit: string;
  unit_size_in_g_or_ml: number;
  estimated_calories: number;
  estimated_macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
  notes: string;
}

export class SmartNutritionEngine {
  
  /**
   * Main method to get intelligent portion recommendations
   */
  static getPortionRecommendation(input: NutritionInput): NutritionOutput {
    const itemName = input.item_name.toLowerCase();
    const baseCalories = input.base_calories_per_100g_or_100ml;
    const baseMacros = input.base_macros_per_100g_or_100ml;
    
    // Get portion data based on food category
    const portionData = this.getPortionData(itemName);
    
    // Calculate scaled nutrition values
    const multiplier = portionData.unit_size_in_g_or_ml / 100;
    
    return {
      recommended_unit: portionData.recommended_unit,
      unit_size_in_g_or_ml: portionData.unit_size_in_g_or_ml,
      estimated_calories: Math.round(baseCalories * multiplier),
      estimated_macros: {
        carbs: Math.round(baseMacros.carbs * multiplier * 10) / 10,
        protein: Math.round(baseMacros.protein * multiplier * 10) / 10,
        fat: Math.round(baseMacros.fat * multiplier * 10) / 10,
      },
      notes: portionData.notes
    };
  }
  
  /**
   * Get portion data based on food categorization
   */
  private static getPortionData(itemName: string): {
    recommended_unit: string;
    unit_size_in_g_or_ml: number;
    notes: string;
  } {
    
    // 1. ALCOHOLIC BEVERAGES
    if (this.matchesPattern(itemName, ["beer", "lager", "ale"])) {
      if (itemName.includes("kingfisher") || itemName.includes("budweiser")) {
        return {
          recommended_unit: "bottle (650ml)",
          unit_size_in_g_or_ml: 650,
          notes: "Standard large beer bottle size in India; calculated from base per 100ml"
        };
      }
      return {
        recommended_unit: "bottle (500ml)",
        unit_size_in_g_or_ml: 500,
        notes: "Standard beer bottle size; calculated from base per 100ml"
      };
    }
    
    if (this.matchesPattern(itemName, ["wine", "red wine", "white wine"])) {
      return {
        recommended_unit: "glass (150ml)",
        unit_size_in_g_or_ml: 150,
        notes: "Standard wine serving glass; calculated from base per 100ml"
      };
    }
    
    if (this.matchesPattern(itemName, ["whiskey", "vodka", "rum", "gin", "brandy"])) {
      return {
        recommended_unit: "shot (30ml)",
        unit_size_in_g_or_ml: 30,
        notes: "Standard spirit shot size; calculated from base per 100ml"
      };
    }
    
    // 2. SOFT DRINKS & BEVERAGES
    if (this.matchesPattern(itemName, ["coca-cola", "coke", "pepsi", "sprite", "fanta"])) {
      return {
        recommended_unit: "bottle (500ml)",
        unit_size_in_g_or_ml: 500,
        notes: "Standard soft drink bottle size; calculated from base per 100ml"
      };
    }
    
    if (this.matchesPattern(itemName, ["juice", "orange juice", "apple juice", "mango juice"])) {
      return {
        recommended_unit: "glass (250ml)",
        unit_size_in_g_or_ml: 250,
        notes: "Standard juice glass serving; calculated from base per 100ml"
      };
    }
    
    if (this.matchesPattern(itemName, ["tea", "chai", "coffee", "espresso", "latte", "cappuccino"])) {
      return {
        recommended_unit: "cup (200ml)",
        unit_size_in_g_or_ml: 200,
        notes: "Standard tea/coffee cup size; calculated from base per 100ml"
      };
    }
    
    if (this.matchesPattern(itemName, ["lassi", "buttermilk", "chaas"])) {
      return {
        recommended_unit: "glass (250ml)",
        unit_size_in_g_or_ml: 250,
        notes: "Traditional Indian drink glass size; calculated from base per 100ml"
      };
    }
    
    // 3. INDIAN MAIN DISHES
    if (this.matchesPattern(itemName, ["rice", "basmati rice", "jeera rice"])) {
      return {
        recommended_unit: "medium portion (150g)",
        unit_size_in_g_or_ml: 150,
        notes: "Standard rice serving with Indian meals; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["biryani", "pulao", "pilaf", "fried rice"])) {
      return {
        recommended_unit: "medium portion (200g)",
        unit_size_in_g_or_ml: 200,
        notes: "Larger portion for special rice dishes; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["dal", "daal", "sambhar", "rasam"])) {
      return {
        recommended_unit: "medium bowl (200g)",
        unit_size_in_g_or_ml: 200,
        notes: "Standard dal serving bowl in Indian meals; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["curry", "sabzi", "gravy", "masala"])) {
      return {
        recommended_unit: "serving (150g)",
        unit_size_in_g_or_ml: 150,
        notes: "Standard curry serving with rice/roti; calculated from base per 100g"
      };
    }
    
    // 4. INDIAN BREADS
    if (this.matchesPattern(itemName, ["roti", "chapati", "phulka"])) {
      return {
        recommended_unit: "medium roti (50g)",
        unit_size_in_g_or_ml: 50,
        notes: "Standard homemade roti size; typically eaten 2-3 pieces; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["naan", "kulcha", "paratha"])) {
      return {
        recommended_unit: "piece (80g)",
        unit_size_in_g_or_ml: 80,
        notes: "Restaurant-style bread size; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["idli", "vada", "medu vada"])) {
      return {
        recommended_unit: "piece (30g)",
        unit_size_in_g_or_ml: 30,
        notes: "Standard South Indian breakfast item; typically served 3-4 pieces; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["dosa", "uttapam", "rava dosa"])) {
      return {
        recommended_unit: "piece (100g)",
        unit_size_in_g_or_ml: 100,
        notes: "Standard dosa size; calculated from base per 100g"
      };
    }
    
    // 5. FRUITS
    if (this.matchesPattern(itemName, ["apple", "apples"])) {
      return {
        recommended_unit: "medium (180g)",
        unit_size_in_g_or_ml: 180,
        notes: "Medium-sized apple weight; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["banana", "bananas"])) {
      return {
        recommended_unit: "medium (120g)",
        unit_size_in_g_or_ml: 120,
        notes: "Medium-sized banana weight; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["mango", "mangoes"])) {
      return {
        recommended_unit: "medium (200g)",
        unit_size_in_g_or_ml: 200,
        notes: "Medium-sized mango weight; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["orange", "oranges"])) {
      return {
        recommended_unit: "medium (180g)",
        unit_size_in_g_or_ml: 180,
        notes: "Medium-sized orange weight; calculated from base per 100g"
      };
    }
    
    // 6. SNACKS & FAST FOOD
    if (this.matchesPattern(itemName, ["samosa", "samosas"])) {
      return {
        recommended_unit: "piece (100g)",
        unit_size_in_g_or_ml: 100,
        notes: "Standard samosa size; typically eaten 1-2 pieces; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["pizza", "pizza slice"])) {
      return {
        recommended_unit: "slice (120g)",
        unit_size_in_g_or_ml: 120,
        notes: "Medium pizza slice weight; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["burger", "hamburger"])) {
      return {
        recommended_unit: "piece (150g)",
        unit_size_in_g_or_ml: 150,
        notes: "Standard burger weight; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["hot dog", "hotdog"])) {
      return {
        recommended_unit: "piece (75g)",
        unit_size_in_g_or_ml: 75,
        notes: "Standard hot dog with bun weight; calculated from base per 100g"
      };
    }
    
    // 7. DAIRY PRODUCTS
    if (this.matchesPattern(itemName, ["milk", "whole milk", "toned milk"])) {
      return {
        recommended_unit: "glass (250ml)",
        unit_size_in_g_or_ml: 250,
        notes: "Standard milk glass serving; calculated from base per 100ml"
      };
    }
    
    if (this.matchesPattern(itemName, ["dahi", "yogurt", "curd"])) {
      return {
        recommended_unit: "bowl (150g)",
        unit_size_in_g_or_ml: 150,
        notes: "Standard curd serving bowl; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["paneer", "cottage cheese"])) {
      return {
        recommended_unit: "serving (100g)",
        unit_size_in_g_or_ml: 100,
        notes: "Standard paneer curry serving; calculated from base per 100g"
      };
    }
    
    // 8. MEAT & SEAFOOD
    if (this.matchesPattern(itemName, ["chicken", "chicken breast", "chicken curry"])) {
      return {
        recommended_unit: "serving (120g)",
        unit_size_in_g_or_ml: 120,
        notes: "Standard chicken serving portion; calculated from base per 100g"
      };
    }
    
    if (this.matchesPattern(itemName, ["fish", "fish curry", "salmon", "tuna"])) {
      return {
        recommended_unit: "serving (100g)",
        unit_size_in_g_or_ml: 100,
        notes: "Standard fish serving portion; calculated from base per 100g"
      };
    }
    
    // 9. DEFAULT CATEGORIES
    if (this.matchesPattern(itemName, ["soup", "broth"])) {
      return {
        recommended_unit: "bowl (250ml)",
        unit_size_in_g_or_ml: 250,
        notes: "Standard soup bowl serving; calculated from base per 100ml"
      };
    }
    
    // DEFAULT FALLBACK
    return {
      recommended_unit: "serving (100g)",
      unit_size_in_g_or_ml: 100,
      notes: "Standard serving size; calculated from base per 100g"
    };
  }
  
  /**
   * Helper method to match food names against patterns
   */
  private static matchesPattern(itemName: string, patterns: string[]): boolean {
    return patterns.some(pattern => itemName.includes(pattern));
  }
}

/**
 * Express route handler for the nutrition engine API
 */
export function processNutritionRequest(input: NutritionInput): NutritionOutput {
  return SmartNutritionEngine.getPortionRecommendation(input);
}
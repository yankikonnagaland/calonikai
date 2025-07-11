import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Food } from "@shared/schema";
import { calculateNutritionFromUnit, formatNutritionDisplay, validateCalorieCalculation, extractGramFromUnit } from "@shared/unitCalculations";
import SubscriptionModal from "./SubscriptionModal";
import { DailyLimitNotification } from "./DailyLimitNotification";
import calonikLogo from "@assets/CALONIK LOGO TRANSPARENT_1751559015747.png";

// AI Food Analysis Hook
const useAIFoodAnalysis = () => {
  const analyzeFood = useCallback(async (foodName: string): Promise<{
    enhancedCategory: string;
    smartUnit: string;
    smartQuantity: number;
    unitOptions: string[];
    aiConfidence: number;
    reasoning: string;
  } | null> => {
    try {
      const response = await apiRequest("POST", "/api/ai-food-analysis", {
        foodName: foodName
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          enhancedCategory: data.category,
          smartUnit: data.smartUnit,
          smartQuantity: data.smartQuantity,
          unitOptions: data.unitOptions,
          aiConfidence: data.aiConfidence || 0.8, // Default confidence
          reasoning: data.reasoning
        };
      }
      
      return null;
    } catch (error) {
      console.log("AI analysis unavailable, using local intelligence");
      return null;
    }
  }, []);

  return { analyzeFood };
};

interface FoodSearchProps {
  sessionId: string;
  selectedDate?: string;
  onFoodSelect: (food: Food | null) => void;
  onMealAdded?: () => void;
  onRedirectToDashboard?: () => void;
  editingFood?: any; // Food item being edited from pencil button
}

export default function FoodSearch({ sessionId, selectedDate, onFoodSelect, onMealAdded, onRedirectToDashboard, editingFood }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1"); // Temporary input state for editing
  const [unit, setUnit] = useState("serving");
  const [unitOptions, setUnitOptions] = useState<string[]>(["serving", "piece", "cup"]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(""); // Trigger for manual search
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    enhancedCategory: string;
    smartUnit: string;
    smartQuantity: number;
    unitOptions: string[];
    aiConfidence: number;
    reasoning: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDailyLimitNotification, setShowDailyLimitNotification] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();
  const { analyzeFood } = useAIFoodAnalysis();

  // Get user's daily usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['/api/usage-stats'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Handle manual search trigger
  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      setSearchTrigger(searchQuery.trim());
      setShowSuggestions(true);
    }
  };

  // Handle Enter key press to trigger search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle external food selection from parent (pencil button editing)
  useEffect(() => {
    if (onFoodSelect) {
      onFoodSelect(selectedFood);
    }
  }, [onFoodSelect]);

  // Handle editing food prop changes from parent component
  useEffect(() => {
    if (editingFood && editingFood.isEditing) {
      // Pre-populate the form with editing data
      setSearchQuery(editingFood.name || "");
      setQuantity(editingFood.quantity || 1);
      setUnit(editingFood.unit || "serving");
      setShowSuggestions(false);
      
      // Set the selected food for the nutrition display
      setSelectedFood(editingFood);
      
      // Focus the search input and select text for easy replacement
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }, 200);
    }
  }, [editingFood]);

  // Sync quantityInput with quantity state
  useEffect(() => {
    setQuantityInput(quantity.toString());
  }, [quantity]);

  const { data: rawSearchResults = [], isLoading: isSearching } = useQuery<Food[]>({
    queryKey: [`/api/foods/enhanced-search`, searchTrigger],
    queryFn: async () => {
      console.log("Making enhanced search request for:", searchTrigger);
      try {
        const response = await apiRequest("GET", `/api/foods/enhanced-search?query=${encodeURIComponent(searchTrigger)}`);
        
        // Check if response indicates daily limit reached
        if (response.status === 429) {
          setShowDailyLimitNotification(true);
          throw new Error("Daily food search limit reached");
        }
        
        const results = await response.json();
        console.log("Enhanced search results:", results);
        
        // Frontend deduplication as extra safety
        const uniqueResults = results.filter((food: Food, index: number, self: Food[]) =>
          index === self.findIndex((f: Food) => 
            f.name.toLowerCase() === food.name.toLowerCase() && 
            f.category === food.category
          )
        );
        
        return uniqueResults;
      } catch (error: any) {
        if (error.message.includes("429") || error.message.includes("limit")) {
          setShowDailyLimitNotification(true);
        }
        throw error;
      }
    },
    enabled: searchTrigger.length > 0,
    retry: false, // Don't retry on limit errors
  });

  // Use deduplicated results
  const searchResults = rawSearchResults;

  // Automatically reset quantity to 1 and unit to first option after search results are displayed
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && !editingFood?.isEditing) {
      // Reset quantity to 1
      setQuantity(1);
      setQuantityInput("1");
      
      // Reset unit to first option from the first food item
      const firstFood = searchResults[0] as any; // Enhanced search results have unitOptions
      if (firstFood && firstFood.unitOptions && Array.isArray(firstFood.unitOptions) && firstFood.unitOptions.length > 0) {
        setUnit(firstFood.unitOptions[0]);
      } else if (firstFood && firstFood.defaultUnit) {
        setUnit(firstFood.defaultUnit);
      } else {
        setUnit("serving"); // fallback default
      }
    }
  }, [searchResults, editingFood?.isEditing]);

  const addMealMutation = useMutation({
    mutationFn: async (mealItem: { foodId: number; quantity: number; unit: string; sessionId: string; foodName?: string }) => {
      console.log("Sending meal item:", mealItem);
      return apiRequest("POST", "/api/meal", mealItem);
    },
    onSuccess: async () => {
      // Invalidate meal queries
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary`] });
      
      // After adding food to meal, auto-submit to daily summary to prevent overwrites
      try {
        const mealItems = await apiRequest("GET", `/api/meal/${sessionId}/${selectedDate}`);
        
        if (mealItems && mealItems.length > 0) {
          const totals = mealItems.reduce((acc: any, item: any) => {
            // Use stored frontend nutrition if available, otherwise calculate
            const calories = item.frontendCalories || (item.food.calories * item.quantity);
            const protein = item.frontendProtein || (item.food.protein * item.quantity);
            const carbs = item.frontendCarbs || (item.food.carbs * item.quantity);
            const fat = item.frontendFat || (item.food.fat * item.quantity);
            
            acc.calories += calories;
            acc.protein += protein;
            acc.carbs += carbs;
            acc.fat += fat;
            return acc;
          }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
          
          const dailySummary = {
            sessionId,
            date: selectedDate || new Date().toISOString().split('T')[0],
            totalCalories: Math.round(totals.calories * 100) / 100,
            totalProtein: Math.round(totals.protein * 100) / 100,
            totalCarbs: Math.round(totals.carbs * 100) / 100,
            totalFat: Math.round(totals.fat * 100) / 100,
            caloriesBurned: 0,
            netCalories: Math.round(totals.calories * 100) / 100,
            mealData: JSON.stringify(mealItems)
          };
          
          // Auto-submit to daily summary
          await apiRequest("POST", "/api/daily-summary", dailySummary);
          
          // Clear the current meal after auto-submission
          const targetDate = selectedDate || new Date().toISOString().split('T')[0];
          await apiRequest("DELETE", `/api/meal/clear/${sessionId}/${targetDate}`);
          
          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDate}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${selectedDate}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/analytics/user-progress`] });
          
          console.log("✅ Auto-submitted meal to daily summary to prevent overwrites");
        }
      } catch (error) {
        console.error("Failed to auto-submit meal to daily summary:", error);
      }
      
      if (onMealAdded) {
        onMealAdded();
      }
      toast({
        title: "Success",
        description: "Food added to your daily summary",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add food to meal",
        variant: "destructive",
      });
    },
  });

  const getIntelligentFoodSuggestion = async (food: Food) => {
    try {
      const response = await fetch("/api/intelligent-food-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: food.name,
          category: food.category || "",
          calories: food.calories,
          portionSize: food.portionSize
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get intelligent food analysis");
      }
      
      return await response.json();
    } catch (error) {
      // Enhanced intelligent fallback based on food analysis
      return getIntelligentUnits(food);
    }
  };

  const getIntelligentUnits = (food: Food) => {
    const name = food.name.toLowerCase();
    const category = food.category?.toLowerCase() || "";
    
    // === BEVERAGES ===
    
    // Water - zero calories
    if (name.includes("water")) {
      return {
        unit: "glass (250ml)",
        quantity: 1,
        unitOptions: ["glass (250ml)", "bottle (500ml)", "bottle (1000ml)", "ml"],
        reasoning: "Water is typically consumed in glasses or bottles"
      };
    }
    
    // Hot beverages - smaller servings
    if (name.match(/\b(tea|coffee|chai|latte|cappuccino|espresso)\b/)) {
      return {
        unit: "cup (200ml)",
        quantity: 1,
        unitOptions: ["small cup (150ml)", "cup (200ml)", "cup (250ml)", "mug (300ml)", "large cup (400ml)", "shot (30ml)", "ml"],
        reasoning: "Standard coffee/tea servings range from 150–300ml depending on type and café"
      };
    }
    
    // Cold beverages and soft drinks
    if (name.match(/\b(juice|cola|soda|soft drink|coke|pepsi)\b/)) {
      return {
        unit: "glass (250ml)",
        quantity: 1,
        unitOptions: ["glass (250ml)", "can (330ml)", "bottle (500ml)", "bottle (600ml)", "ml"],
        reasoning: "Cold drinks in glasses or cans/bottles"
      };
    }
    
    // Dairy beverages
    if (name.match(/\b(milk|lassi|shake|smoothie|milkshake)\b/)) {
      return {
        unit: "glass (250ml)",
        quantity: 1,
        unitOptions: ["glass (200ml)", "glass (250ml)", "cup (300ml)", "large glass (400ml)", "ml"],
        reasoning: "Dairy beverages typically served in glasses"
      };
    }
    
    // Beer
    if (name.includes("beer")) {
      return {
        unit: "bottle (650ml)",
        quantity: 1,
        unitOptions: ["glass (250ml)", "can (330ml)", "bottle (500ml)", "bottle (650ml)", "pint (568ml)"],
        reasoning: "Beer commonly served in bottles, 650ml is large bottle size"
      };
    }
    
    // Wine
    if (name.includes("wine")) {
      return {
        unit: "glass (150ml)",
        quantity: 1,
        unitOptions: ["glass (150ml)", "glass (200ml)", "bottle (750ml)", "ml"],
        reasoning: "Wine served in 150ml standard glasses"
      };
    }
    
    // Spirits
    if (name.match(/\b(whiskey|vodka|rum|gin|spirit)\b/)) {
      return {
        unit: "shot (30ml)",
        quantity: 1,
        unitOptions: ["shot (30ml)", "double (60ml)", "ml"],
        reasoning: "Spirits measured in 30ml shots"
      };
    }
    
    // 2. GRAINS & RICE DISHES - Enhanced with realistic portions
    if (name.match(/\b(rice|biryani|pulao|pilaf|quinoa|oats|muesli|cereal|porridge|khichdi)\b/)) {
      const isSpecialRice = name.match(/\b(biryani|pulao|pilaf)\b/);
      return {
        unit: isSpecialRice ? "medium portion (200g)" : "medium portion (150g)",
        quantity: 1,
        unitOptions: ["small portion (100g)", "medium portion (150g)", "large portion (200g)", "bowl", "cup", "grams"],
        reasoning: isSpecialRice ? "Special rice dishes are served in larger 200g portions" : "Plain rice typically served in 150g portions"
      };
    }
    
    // 3. CURRIES & LIQUID DISHES - Enhanced with realistic portions
    if (name.match(/\b(curry|dal|daal|soup|stew|gravy|sambhar|rasam|kadhi)\b/)) {
      const isDal = name.match(/\b(dal|daal)\b/);
      const isSoup = name.match(/\b(soup|rasam)\b/);
      
      if (isDal) {
        return {
          unit: "medium bowl (200g)",
          quantity: 1,
          unitOptions: ["small bowl (150g)", "medium bowl (200g)", "large bowl (300g)", "grams"],
          reasoning: "Dal is typically served in 200g portions as main accompaniment"
        };
      } else if (isSoup) {
        return {
          unit: "bowl (250ml)",
          quantity: 1,
          unitOptions: ["small bowl (200ml)", "bowl (250ml)", "large bowl (350ml)", "grams"],
          reasoning: "Soups are liquid-based, measured in ml portions"
        };
      } else {
        return {
          unit: "serving (150g)",
          quantity: 1,
          unitOptions: ["small serving (100g)", "serving (150g)", "large serving (200g)", "grams"],
          reasoning: "Curries are typically served in 150g portions with rice"
        };
      }
    }
    
    // 4. BREAD & FLATBREADS - Enhanced with realistic sizes
    if (name.match(/\b(roti|chapati|naan|bread|toast|paratha|puri|kulcha|dosa|uttapam|idli|vada)\b/)) {
      if (name.match(/\b(roti|chapati)\b/)) {
        return {
          unit: "medium roti (50g)",
          quantity: 1,
          unitOptions: ["small roti (35g)", "medium roti (50g)", "large roti (70g)"],
          reasoning: "Rotis are typically eaten 2 at a time, medium size is 50g each"
        };
      } else if (name.match(/\b(naan|paratha)\b/)) {
        return {
          unit: "piece (80g)",
          quantity: 1,
          unitOptions: ["small (60g)", "piece (80g)", "large (100g)"],
          reasoning: "Naan and paratha are larger, typically 80g each"
        };
      } else if (name.match(/\b(idli|vada)\b/)) {
        return {
          unit: "piece (30g)",
          quantity: 1,
          unitOptions: ["piece (30g)", "small (25g)", "large (40g)"],
          reasoning: "Idli/vada are small, typically served 3 pieces (30g each)"
        };
      } else if (name.match(/\b(dosa|uttapam)\b/)) {
        return {
          unit: "piece (100g)",
          quantity: 1,
          unitOptions: ["small (80g)", "piece (100g)", "large (120g)"],
          reasoning: "Dosas are large, typically 100g each"
        };
      } else {
        return {
          unit: "slice (25g)",
          quantity: 1,
          unitOptions: ["slice (25g)", "piece", "small", "medium"],
          reasoning: "Bread slices are typically 25g each, eaten 2 at a time"
        };
      }
    }
    
    // 5. FRUITS - Enhanced with realistic weights
    if (category.includes("fruit") || 
        name.match(/\b(apple|banana|orange|mango|grapes|strawberry|pineapple|watermelon|papaya|guava|pomegranate)\b/)) {
      // Whole fruits vs cut fruits
      if (name.includes("slice") || name.includes("chopped") || name.includes("cut")) {
        return {
          unit: "cup (150g)",
          quantity: 1,
          unitOptions: ["cup (150g)", "bowl (200g)", "serving (100g)"],
          reasoning: "Cut fruits measured by volume, 150g per cup"
        };
      } else {
        // Specific fruit weights
        if (name.includes("apple") || name.includes("orange")) {
          return {
            unit: "piece (180g)",
            quantity: 1,
            unitOptions: ["small (120g)", "piece (180g)", "large (250g)"],
            reasoning: "Medium apple/orange weighs about 180g"
          };
        } else if (name.includes("banana")) {
          return {
            unit: "piece (120g)",
            quantity: 1,
            unitOptions: ["small (80g)", "piece (120g)", "large (150g)"],
            reasoning: "Medium banana weighs about 120g"
          };
        } else if (name.includes("mango")) {
          return {
            unit: "piece (200g)",
            quantity: 1,
            unitOptions: ["small (150g)", "piece (200g)", "large (300g)"],
            reasoning: "Medium mango weighs about 200g"
          };
        } else {
          return {
            unit: "piece (150g)",
            quantity: 1,
            unitOptions: ["small (100g)", "piece (150g)", "large (200g)"],
            reasoning: "Medium fruit weighs about 150g"
          };
        }
      }
    }
    
    // 6. VEGETABLES - Enhanced with realistic portions
    if (category.includes("vegetable") || 
        name.match(/\b(potato|onion|tomato|carrot|spinach|cabbage|peas|beans|cauliflower|broccoli)\b/)) {
      
      // Leafy vegetables
      if (name.match(/\b(spinach|cabbage|lettuce|kale)\b/)) {
        return {
          unit: "cup (100g)",
          quantity: 1,
          unitOptions: ["cup (100g)", "handful (50g)", "large portion (150g)"],
          reasoning: "Leafy vegetables measured by volume, 100g per cup"
        };
      }
      
      // Root vegetables
      if (name.match(/\b(potato|onion|carrot|radish|beetroot)\b/)) {
        return {
          unit: "medium (100g)",
          quantity: 1,
          unitOptions: ["small (50g)", "medium (100g)", "large (150g)", "pieces"],
          reasoning: "Root vegetables vary in size, medium is about 100g"
        };
      }
      
      return {
        unit: "serving (100g)",
        quantity: 1,
        unitOptions: ["small serving (50g)", "serving (100g)", "large serving (150g)"],
        reasoning: "Standard vegetable serving is 100g"
      };
    }
    
    // 7. PROTEIN FOODS - Enhanced with realistic portions
    if (name.match(/\b(chicken|mutton|beef|pork|fish|paneer|egg|tofu)\b/)) {
      
      if (name.match(/\b(egg|omelette)\b/)) {
        return {
          unit: "piece (50g)",
          quantity: 1,
          unitOptions: ["1 piece (50g)", "2 pieces (100g)", "3 pieces (150g)"],
          reasoning: "Eggs are typically eaten 1-2 at a time, 50g each"
        };
      }
      
      if (name.includes("paneer") || name.includes("tofu")) {
        return {
          unit: "medium portion (100g)",
          quantity: 1,
          unitOptions: ["small portion (50g)", "medium portion (100g)", "large portion (150g)"],
          reasoning: "Paneer/tofu typically served in 100g portions"
        };
      }
      
      // Meat dishes
      return {
        unit: "medium portion (120g)",
        quantity: 1,
        unitOptions: ["small portion (80g)", "medium portion (120g)", "large portion (180g)", "piece"],
        reasoning: "Meat dishes typically served in 120g portions"
      };
    }
    
    // 8. PASTA & NOODLES - Enhanced with realistic portions
    if (name.match(/\b(pasta|noodles|spaghetti|macaroni|maggi|ramen|hakka)\b/)) {
      return {
        unit: "medium portion (150g)",
        quantity: 1,
        unitOptions: ["small portion (100g)", "medium portion (150g)", "large portion (200g)", "bowl"],
        reasoning: "Pasta/noodles typically served in 150g cooked portions"
      };
    }
    
    // 9. SNACKS & SWEETS - Enhanced with realistic portions
    if (name.match(/\b(samosa|pakora|vada|bhaji|sweet|laddu|barfi|halwa)\b/)) {
      
      if (name.match(/\b(sweet|laddu|barfi|halwa)\b/)) {
        return {
          unit: "piece (30g)",
          quantity: 1,
          unitOptions: ["1 piece (30g)", "2 pieces (60g)", "small portion (50g)", "medium portion (80g)"],
          reasoning: "Traditional sweets are small, typically 30g each"
        };
      }
      
      // Fried snacks
      return {
        unit: "piece (40g)",
        quantity: 1,
        unitOptions: ["1 piece (40g)", "2 pieces (80g)", "3 pieces (120g)", "pieces"],
        reasoning: "Fried snacks like samosa/pakora are about 40g each"
      };
    }
    
    // 10. NUTS & DRY FRUITS - Enhanced with pieces and realistic portions
    if (name.match(/\b(almond|cashew|walnut|peanut|raisin|dates|nuts)\b/)) {
      // Individual nuts - default to pieces
      if (name.match(/\b(almond|cashew|walnut|peanut)\b/)) {
        return {
          unit: "pieces",
          quantity: 10,
          unitOptions: ["pieces", "handful (30g)", "small handful (15g)", "large handful (45g)", "grams"],
          reasoning: "Individual nuts typically counted in pieces, about 10 pieces = 1 serving"
        };
      }
      
      // Dried fruits and mixed nuts - default to handful
      return {
        unit: "handful (30g)",
        quantity: 1,
        unitOptions: ["handful (30g)", "small handful (15g)", "large handful (45g)", "tablespoon (10g)", "pieces"],
        reasoning: "Dried fruits typically consumed in handfuls, about 30g"
      };
    }
    
    // 11. FAST FOOD - Enhanced with realistic portions
    if (name.match(/\b(burger|sandwich|pizza|wrap|roll)\b/)) {
      
      if (name.includes("pizza")) {
        return {
          unit: "slice (80g)",
          quantity: 1,
          unitOptions: ["1 slice (80g)", "2 slices (160g)", "3 slices (240g)", "slices"],
          reasoning: "Pizza slices are about 80g each, typically eaten 2 slices"
        };
      }
      
      if (name.includes("burger")) {
        return {
          unit: "medium (180g)",
          quantity: 1,
          unitOptions: ["small (120g)", "medium (180g)", "large (250g)", "pieces"],
          reasoning: "Medium burger weighs about 180g"
        };
      }
      
      return {
        unit: "piece (150g)",
        quantity: 1,
        unitOptions: ["small (100g)", "piece (150g)", "large (200g)"],
        reasoning: "Sandwiches/wraps typically weigh 150g"
      };
    }
    
    // 12. CHIPS & PACKAGED SNACKS
    if (name.match(/\b(chips|biscuit|cookie|wafer|namkeen)\b/)) {
      return {
        unit: "small pack (30g)",
        quantity: 1,
        unitOptions: ["small pack (30g)", "medium pack (50g)", "large pack (80g)", "piece"],
        reasoning: "Packaged snacks come in standard pack sizes"
      };
    }
    
    // === DEFAULT ===
    return {
      unit: "medium (100g)",
      quantity: 1,
      unitOptions: ["small (80g)", "medium (100g)", "large (150g)", "grams", "pieces"],
      reasoning: "Standard serving size for most foods"
    };
  };

  const handleFoodSelect = useCallback(async (food: Food) => {
    // Immediately update UI state for instant responsiveness
    setSelectedFood(food);
    onFoodSelect(food);
    setShowSuggestions(false);
    setSearchQuery("");
    setSearchTrigger("");
    
    // Reset quantity to 1 when selecting a new food item
    setQuantity(1);
    setQuantityInput("1");
    
    // Clear any pending hide timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    // PRIORITY 1: Check for pre-loaded AI analysis first (INSTANT)
    const enhancedFood = food as any;
    if (enhancedFood.aiAnalysis) {
      console.log("🚀 INSTANT UNIT SELECTION: Using pre-loaded AI analysis for", food.name, enhancedFood.aiAnalysis);
      setAiAnalysis(enhancedFood.aiAnalysis);
      setUnit(enhancedFood.aiAnalysis.smartUnit);
      setQuantity(enhancedFood.aiAnalysis.smartQuantity);
      setUnitOptions(enhancedFood.aiAnalysis.unitOptions);
      setIsAnalyzing(false);
      return; // Skip all API calls since we have instant data
    }
    
    // PRIORITY 2: Use enhanced search defaultUnit (AI-enhanced)
    if (enhancedFood.defaultUnit && enhancedFood.unitOptions) {
      console.log("🎯 Using AI-enhanced defaultUnit from search for", food.name, ":", enhancedFood.defaultUnit);
      setUnit(enhancedFood.defaultUnit);
      setQuantity(1);
      setUnitOptions(enhancedFood.unitOptions);
      setIsAnalyzing(false);
      return; // Skip Smart suggestions and use AI-enhanced data
    }
    
    // PRIORITY 3: Use enhanced portion data if available from AI detection
    if ((food as any).smartUnit && (food as any).smartQuantity) {
      console.log(`Using enhanced portion data for ${food.name}: ${(food as any).smartQuantity} ${(food as any).smartUnit}`);
      setUnit((food as any).smartUnit);
      setQuantity(1); // Always reset to 1
      setUnitOptions([(food as any).smartUnit, "serving (100g)", "grams", "pieces"]);
      setIsAnalyzing(false);
      return; // Skip Smart suggestions
    }
    
    // PRIORITY 4: Fallback to Smart suggestions only if no AI data available
    const localSuggestion = getIntelligentUnits(food);
    setUnit(localSuggestion.unit);
    setQuantity(1); // Always reset to 1
    setUnitOptions(localSuggestion.unitOptions);
    
    // ONLY run background AI analysis if no AI data was provided from search
    console.log("⚙️ Running background AI analysis since no pre-loaded data available");
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    try {
      const aiResult = await analyzeFood(food.name);
      if (aiResult) {
        setAiAnalysis(aiResult);
        console.log(`AI Enhanced Analysis for ${food.name}:`, aiResult);
        
        // Update unit options with AI suggestions if better than Smart suggestions
        if (aiResult.aiConfidence > 0.7) {
          console.log("🤖 Applying background AI analysis (high confidence)");
          setUnit(aiResult.smartUnit);
          setQuantity(aiResult.smartQuantity);
          setUnitOptions(aiResult.unitOptions);
        }
      }
    } catch (error) {
      console.log("AI analysis failed, using Smart suggestions fallback");
    } finally {
      setIsAnalyzing(false);
    }
    
  }, [onFoodSelect, analyzeFood]);

  const handleInputFocus = () => {
    if (searchQuery.length > 0 && searchResults.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Clear any existing timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    // Delay hiding suggestions to allow for clicks
    suggestionTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Show suggestions when search results are available
  useEffect(() => {
    if (searchTrigger.length > 0 && searchResults.length > 0) {
      setShowSuggestions(true);
    } else if (searchTrigger.length === 0) {
      setShowSuggestions(false);
    }
  }, [searchResults, searchTrigger]);

  // Debug logging
  useEffect(() => {
    const shouldShow = showSuggestions && searchTrigger.length > 0 && searchResults.length > 0;
    console.log("Search debug:", {
      searchQuery,
      searchTrigger,
      showSuggestions,
      searchResultsLength: searchResults.length,
      shouldShowSuggestions: shouldShow
    });
  }, [searchQuery, searchTrigger, showSuggestions, searchResults.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced nutrition multiplier calculation with food-specific intelligence
  const getUnitMultiplier = (unit: string, food: Food) => {
    const unitLower = unit.toLowerCase();
    const name = food.name.toLowerCase();
    
    // Water always has 0 calories regardless of unit or quantity
    if (name.includes("water")) {
      return 0;
    }
    
    // PRIORITY 1: Extract volume/weight from unit descriptions for accurate calculations
    
    // VOLUME-BASED UNITS (for beverages) - Extract ml and calculate based on 100ml base
    const mlMatch = unitLower.match(/\((\d+)ml\)/);
    if (mlMatch) {
      const mlAmount = parseInt(mlMatch[1]);
      console.log(`Volume calculation: ${mlAmount}ml = ${mlAmount/100}x multiplier`);
      return mlAmount / 100; // Base nutrition is per 100ml
    }
    
    // WEIGHT-BASED UNITS (for solid foods) - Extract grams and calculate based on 100g base
    const gMatch = unitLower.match(/\((\d+)g\)/);
    if (gMatch) {
      const gAmount = parseInt(gMatch[1]);
      console.log(`Weight calculation: ${gAmount}g = ${gAmount/100}x multiplier`);
      return gAmount / 100; // Base nutrition is per 100g
    }
    
    // PRIORITY 2: Predefined specific beverage units (fallback for common descriptions)
    if (unitLower.includes("glass (250ml)")) return 2.5; // 250ml = 2.5 x 100ml
    if (unitLower.includes("bottle (500ml)")) return 5.0; // 500ml = 5 x 100ml
    if (unitLower.includes("bottle (650ml)")) return 6.5; // 650ml = 6.5 x 100ml
    if (unitLower.includes("bottle (330ml)")) return 3.3; // 330ml = 3.3 x 100ml
    if (unitLower.includes("can (330ml)")) return 3.3; // 330ml = 3.3 x 100ml
    if (unitLower.includes("cup (240ml)")) return 2.4; // 240ml = 2.4 x 100ml
    
    // PRIORITY 3: General unit patterns (when specific volume/weight not found)
    const baseMultipliers: Record<string, number> = {
      // Standard portions
      "serving": 1.0,
      "half serving": 0.5,
      "quarter": 0.25,
      
      // Size variations
      "small": 0.7,
      "medium": 1.0,
      "large": 1.4,
      "extra large": 1.8,
      
      // Piece-based
      "piece": 0.8,
      "slice": 0.6,
      "scoop": 0.5,
      
      // Volume-based (generic)
      "cup": 2.4, // Standard cup 240ml
      "glass": 2.5, // Standard glass 250ml
      "bowl": 2.0, // Standard bowl 200ml
      "bottle": 5.0, // Standard bottle 500ml
      "can": 3.3, // Standard can 330ml
      
      // Portion descriptions
      "small portion": 0.75,
      "medium portion": 1.5,
      "large portion": 2.0,
      "handful": 0.3,
      
      // Measurement units
      "grams": 0.01, // Direct gram input: divide by 100 for per-100g calculation
      "tablespoon": 0.15,
      "teaspoon": 0.05,
      "ml": 0.01,
      "gram": 0.01, // 1 gram = 1% of 100g base
      "g": 0.01,
    };

    // Get base multiplier
    let multiplier = baseMultipliers[unit] || 1.0;
    
    console.log(`Initial multiplier for ${name} - ${unit}: ${multiplier} (from baseMultipliers)`);
    
    // BEVERAGES - Enhanced volume-based calculations
    if (food.category?.toLowerCase().includes("beverage") || name.match(/\b(cola|coke|pepsi|sprite|beer|juice|tea|coffee|milk|lassi)\b/)) {
      // For beverages, use volume-based multipliers if specific ml not found
      if (unitLower.includes("glass") && !mlMatch) multiplier = 2.5; // 250ml standard
      if (unitLower.includes("bottle") && !mlMatch) multiplier = 5.0; // 500ml standard  
      if (unitLower.includes("can") && !mlMatch) multiplier = 3.3; // 330ml standard
      if (unitLower.includes("cup") && !mlMatch) multiplier = 2.4; // 240ml standard
    }
    
    // NUTS & TRAIL MIXES - Enhanced piece-based calculations
    if (name.match(/\b(nuts|nut|trail|mix|almond|cashew|peanut|walnut|pistachio|mixed nuts)\b/)) {
      // For nuts, "piece" should be much smaller than handful
      if (unitLower.includes("piece")) {
        // Single nuts are very small portions compared to base 100g
        if (name.includes("cashew")) multiplier = 0.015; // ~1.5g per cashew
        else if (name.includes("almond")) multiplier = 0.012; // ~1.2g per almond  
        else if (name.includes("peanut")) multiplier = 0.008; // ~0.8g per peanut
        else if (name.includes("walnut")) multiplier = 0.025; // ~2.5g per walnut half
        else multiplier = 0.015; // Default for mixed nuts
        console.log(`Nuts piece calculation for ${name}: using multiplier ${multiplier} (should be ~${Math.round(food.calories * multiplier)} cal per piece)`);
        return multiplier; // Return immediately to avoid other calculations overriding
      }
      // Handful calculations already handled by weight extraction above
    }

    // MEAT & PROTEIN - Enhanced piece-based calculations for consistent portioning
    if (name.match(/\b(chicken|mutton|fish|beef|pork|lamb|turkey|duck)\b/) && unitLower.includes("piece")) {
      // Meat pieces should be realistic portions - not too large or too small
      if (name.includes("chicken")) multiplier = 0.8; // Chicken piece ~80g
      else if (name.includes("fish")) multiplier = 1.0; // Fish piece ~100g
      else if (name.includes("pork")) multiplier = 0.75; // Pork piece ~75g  
      else if (name.includes("beef")) multiplier = 0.9; // Beef piece ~90g
      else multiplier = 0.75; // Default meat piece ~75g
      console.log(`Meat piece calculation for ${name}: using multiplier ${multiplier} (should be ~${Math.round(food.calories * multiplier)} cal per piece)`);
      return multiplier;
    }
    
    console.log(`Unit multiplier for ${name} - ${unit}: ${multiplier}`);
    return Math.max(0.01, multiplier); // Ensure minimum multiplier
  };

  const handleAddToMeal = () => {
    if (!selectedFood) return;
    
    // Calculate the exact nutrition shown in the food search display
    const basePer100g = (() => {
      if ((selectedFood as any).smartCalories && (selectedFood as any).smartProtein) {
        return {
          calories: (selectedFood as any).smartCalories,
          protein: (selectedFood as any).smartProtein,
          carbs: (selectedFood as any).smartCarbs,
          fat: (selectedFood as any).smartFat
        };
      } else {
        return {
          calories: selectedFood.calories,
          protein: selectedFood.protein,
          carbs: selectedFood.carbs,
          fat: selectedFood.fat
        };
      }
    })();
    
    const calculatedNutrition = calculateNutritionFromUnit(
      selectedFood.name,
      unit,
      quantity,
      basePer100g
    );
    
    const mealItemData = {
      foodId: selectedFood.id,
      quantity: Math.max(0.1, Math.round(quantity * 10) / 10),
      unit,
      sessionId,
      date: selectedDate || new Date().toISOString().split('T')[0],
      // Include food name for AI-generated foods (ID -1 or > 9000000) to preserve original name
      ...((selectedFood.id === -1 || selectedFood.id > 9000000) && { foodName: selectedFood.name }),
      // Pass the exact calories and nutrition from the search display
      frontendCalories: calculatedNutrition.calories,
      frontendProtein: calculatedNutrition.protein,
      frontendCarbs: calculatedNutrition.carbs,
      frontendFat: calculatedNutrition.fat,
      frontendTotalGrams: calculatedNutrition.totalGrams,
    };
    
    console.log("FoodSearch: Current unit value:", unit);
    console.log("FoodSearch: Calculated nutrition:", calculatedNutrition);
    console.log("FoodSearch: Complete meal item data:", mealItemData);
    console.log("FoodSearch: Sending meal item:", mealItemData);
    
    addMealMutation.mutate(mealItemData);
    
    // Clear selection after adding
    setSelectedFood(null);
    onFoodSelect(null);
    setQuantity(1);
    setUnit("serving");
  };

  const shouldShowSuggestions = showSuggestions && searchTrigger.length > 0 && searchResults.length > 0;
  
  console.log("Search debug:", {
    searchQuery,
    searchTrigger,
    showSuggestions,
    searchResultsLength: searchResults.length,
    shouldShowSuggestions
  });

  return (
    <Card className="search-container" data-food-search-card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Food Search
          </div>
          {user && usageStats && (
            <Badge
              variant="outline"
              className="ml-auto text-xs border-purple-300 bg-[#1b2027]"
            >
              {usageStats.remaining?.meals || 0} credits left
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative flex gap-2">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for food..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Suggestions will be shown via useEffect when results come in
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            variant="default"
            size="sm"
            className="px-4 whitespace-nowrap"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Searching...</span>
              </div>
            ) : (
              "Search"
            )}
          </Button>

          
          {shouldShowSuggestions && (
            <div 
              className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking
            >
              {searchResults.map((food: Food, index) => {
                const enhancedFood = food as any;
                const isAiFood = enhancedFood.aiGenerated || food.id === -1 || food.name.includes("(Not Found)");
                const accuracy = enhancedFood.accuracyBadge || enhancedFood.accuracy || 'medium';
                const source = enhancedFood.sourceBadge || enhancedFood.source || 'database';
                const isVerified = enhancedFood.isVerified;
                
                return (
                  <div
                    key={`${food.id}-${index}`}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFoodSelect(food);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{food.name}</span>
                          {/* Accuracy Badge */}
                          {accuracy === 'high' && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                              ✓ High Accuracy
                            </span>
                          )}
                          {accuracy === 'medium' && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full font-medium">
                              ~ Medium
                            </span>
                          )}
                          {accuracy === 'low' && (
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full font-medium">
                              ! Review Needed
                            </span>
                          )}
                          {/* Source Badge */}
                          {source === 'standard' && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                              📊 Standardized
                            </span>
                          )}
                          {isVerified && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
                              ✅ Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div className="flex items-center justify-between">
                            {enhancedFood.realisticCalories ? (
                              <span>
                                <span className="font-medium text-green-600 dark:text-green-400">{enhancedFood.realisticCalories} cal</span> 
                                <span className="text-gray-400 dark:text-gray-500"> ({enhancedFood.portionDisplay || enhancedFood.defaultUnit})</span> • {food.protein}g protein
                              </span>
                            ) : (
                              <span>{food.calories} cal per 100g • {food.protein}g protein</span>
                            )}
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                              {enhancedFood.defaultUnit || enhancedFood.smartUnit || getIntelligentUnits(food).unit}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                              {food.category}
                            </span>
                            {enhancedFood.gramEquivalent && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {enhancedFood.gramEquivalent}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="p-5 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{selectedFood.name}</h3>
                {/* Calorie display text hidden but calculations still work in background */}
              </div>
              <Badge variant="outline" className="bg-white/50">{selectedFood.category}</Badge>
            </div>
            
            {/* AI Analysis Display */}
            {isAnalyzing && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Analysis in progress...</span>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Analyzing food category and optimal serving suggestions
                </div>
              </div>
            )}
            
            {aiAnalysis && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Enhanced Analysis</span>
                  <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    {Math.round(aiAnalysis.aiConfidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  <div className="mb-1">
                    <span className="font-medium">Category:</span> {aiAnalysis.enhancedCategory}
                  </div>
                  <div className="mb-1">
                    <span className="font-medium">Recommended:</span> {aiAnalysis.smartQuantity} {aiAnalysis.smartUnit}
                  </div>

                </div>
              </div>
            )}

            {/* Intelligent Suggestion Display */}
            <div className="mb-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-md border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Suggestion</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {(selectedFood as any).portionExplanation ? (
                  <>
                    <span className="font-medium">{(selectedFood as any).portionExplanation}</span>
                    <br />
                    <span className="text-xs italic">Smart portion size for realistic tracking</span>
                  </>
                ) : (
                  <>
                    Recommended: <span className="font-medium">{quantity} {unit}</span> - 
                    {getIntelligentUnits(selectedFood).reasoning}
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                  Quantity
                </label>
                <Input
                  type="text"
                  value={quantityInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string or valid numbers
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setQuantityInput(value);
                      
                      // Update quantity state only for valid non-empty values
                      if (value !== "") {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          if (unit.toLowerCase().includes("piece")) {
                            setQuantity(Math.round(numValue));
                          } else {
                            setQuantity(numValue);
                          }
                        }
                      }
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select(); // Select all text for easy replacement
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === "" || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
                      // Reset to 1 if empty or invalid
                      setQuantityInput("1");
                      setQuantity(1);
                    } else {
                      const numValue = parseFloat(value);
                      if (unit.toLowerCase().includes("piece")) {
                        const roundedValue = Math.round(numValue);
                        setQuantityInput(roundedValue.toString());
                        setQuantity(roundedValue);
                      } else {
                        setQuantityInput(numValue.toString());
                        setQuantity(numValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters except backspace, delete, arrow keys, etc.
                    if (!/[\d\.\-]/.test(e.key) && 
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) &&
                        !(e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                    }
                  }}
                  className="mt-1 bg-white dark:bg-gray-800 text-lg font-semibold h-12 text-center"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full mt-1 px-3 py-2 h-12 border border-input rounded-md bg-white dark:bg-gray-800 text-lg font-semibold focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {unitOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accurate Nutrition Display with Gram Equivalent */}
            <div className="mb-4">
              {(() => {
                // Calculate per-100g values from smart portion data if available
                let basePer100g = {
                  calories: selectedFood.calories || 0,
                  protein: selectedFood.protein || 0,
                  carbs: selectedFood.carbs || 0,
                  fat: selectedFood.fat || 0
                };
                
                // Always use the original per-100g values from database
                // Smart portion data is for display purposes only, not for recalculating base values
                const hasRealisticData = (selectedFood as any).realisticCalories !== undefined;
                if (hasRealisticData) {
                  const smartUnit = (selectedFood as any).smartUnit;
                  const smartGrams = smartUnit ? extractGramFromUnit(smartUnit) || 70 : 70;
                  const smartCalories = (selectedFood as any).realisticCalories || 0;
                  
                  console.log(`Smart portion calculation for ${selectedFood.name}:`, {
                    smartGrams,
                    smartCalories,
                    calculatedPer100g: basePer100g,
                    originalPer100g: {
                      calories: selectedFood.calories,
                      protein: selectedFood.protein,
                      carbs: selectedFood.carbs,
                      fat: selectedFood.fat
                    }
                  });
                }
                
                const calculatedNutrition = calculateNutritionFromUnit(
                  selectedFood.name,
                  unit,
                  quantity,
                  basePer100g
                );
                
                const validation = validateCalorieCalculation(
                  selectedFood.name,
                  calculatedNutrition.calories,
                  calculatedNutrition.totalGrams
                );
                
                return (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Nutrition for {formatNutritionDisplay(quantity, unit, calculatedNutrition)}:
                    </div>
                    {!validation.isValid && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border">
                        ⚠️ {validation.warning}
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg border border-blue-300 dark:border-blue-700">
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          {calculatedNutrition.calories}
                        </div>
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Calories</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg border border-green-300 dark:border-green-700">
                        <div className="text-xl font-bold text-green-700 dark:text-green-300">
                          {calculatedNutrition.protein}g
                        </div>
                        <div className="text-xs font-medium text-green-600 dark:text-green-400">Protein</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-lg border border-amber-300 dark:border-amber-700">
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                          {calculatedNutrition.carbs}g
                        </div>
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Carbs</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg border border-red-300 dark:border-red-700">
                        <div className="text-xl font-bold text-red-700 dark:text-red-300">
                          {calculatedNutrition.fat}g
                        </div>
                        <div className="text-xs font-medium text-red-600 dark:text-red-400">Fat</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <Button 
              onClick={handleAddToMeal} 
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200" 
              disabled={addMealMutation.isPending}
            >
              {addMealMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding to Meal...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add {quantity} {unit} to Meal
                </div>
              )}
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Daily Limit Notification */}
      <DailyLimitNotification
        show={showDailyLimitNotification}
        message="Daily food search limit reached."
        onDismiss={() => setShowDailyLimitNotification(false)}
      />
      
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </Card>
  );
}
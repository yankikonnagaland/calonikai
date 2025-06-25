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
import { SubscriptionModal } from "./SubscriptionModal";

interface FoodSearchProps {
  sessionId: string;
  selectedDate?: string;
  onFoodSelect: (food: Food | null) => void;
  onMealAdded?: () => void;
  onRedirectToDashboard?: () => void;
}

export default function FoodSearch({ sessionId, selectedDate, onFoodSelect, onMealAdded, onRedirectToDashboard }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("serving");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Get user's daily usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['/api/usage-stats'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Debounce search query to prevent excessive API calls (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [] } = useQuery<Food[]>({
    queryKey: [`/api/foods/search`, debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/foods/search?query=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search foods');
      }
      return response.json();
    },
    enabled: debouncedQuery.length > 0,
  });

  const addMealMutation = useMutation({
    mutationFn: async (mealItem: { foodId: number; quantity: number; unit: string; sessionId: string }) => {
      console.log("Sending meal item:", mealItem);
      return apiRequest("POST", "/api/meal", mealItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary`] });
      if (onMealAdded) {
        onMealAdded();
      }
      toast({
        title: "Success",
        description: "Food added to your meal",
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
    
    // Comprehensive food categorization with intelligent unit selection
    
    // 1. BEVERAGES
    if (category.includes("beverage") || category.includes("drink") || 
        name.match(/\b(tea|coffee|juice|milk|latte|cappuccino|smoothie|shake|cola|soda|water|lassi|chai)\b/)) {
      return {
        unit: "cup",
        quantity: 1,
        unitOptions: ["cup", "glass", "ml", "bottle", "can"],
        reasoning: "Beverages are typically measured in cups or glasses"
      };
    }
    
    // 2. GRAINS & RICE DISHES
    if (name.match(/\b(rice|biryani|pulao|pilaf|quinoa|oats|muesli|cereal|porridge|khichdi)\b/)) {
      return {
        unit: "cup",
        quantity: 1,
        unitOptions: ["cup", "small bowl", "medium bowl", "large bowl", "serving"],
        reasoning: "Grain dishes are best measured in cups or bowls"
      };
    }
    
    // 3. CURRIES & LIQUID DISHES
    if (name.match(/\b(curry|dal|daal|soup|stew|gravy|sambhar|rasam|kadhi)\b/)) {
      return {
        unit: "bowl",
        quantity: 1,
        unitOptions: ["bowl", "cup", "small bowl", "large bowl", "serving"],
        reasoning: "Liquid dishes are typically served in bowls"
      };
    }
    
    // 4. BREAD & FLATBREADS
    if (name.match(/\b(roti|chapati|naan|bread|toast|paratha|puri|kulcha|dosa|uttapam|idli|vada)\b/)) {
      return {
        unit: "piece",
        quantity: 1,
        unitOptions: ["piece", "slice", "small", "medium", "large"],
        reasoning: "Bread items are counted as individual pieces"
      };
    }
    
    // 5. FRUITS
    if (category.includes("fruit") || 
        name.match(/\b(apple|banana|orange|mango|grapes|strawberry|pineapple|watermelon|papaya|guava|pomegranate)\b/)) {
      // Whole fruits vs cut fruits
      if (name.includes("slice") || name.includes("chopped") || name.includes("cut")) {
        return {
          unit: "cup",
          quantity: 1,
          unitOptions: ["cup", "bowl", "serving", "gram"],
          reasoning: "Cut fruits are best measured in cups or servings"
        };
      } else {
        return {
          unit: "piece",
          quantity: 1,
          unitOptions: ["piece", "small", "medium", "large", "cup"],
          reasoning: "Whole fruits are counted as pieces"
        };
      }
    }
    
    // 6. VEGETABLES
    if (category.includes("vegetable") || 
        name.match(/\b(potato|onion|tomato|carrot|broccoli|spinach|cabbage|cauliflower|okra|eggplant)\b/)) {
      if (name.match(/\b(salad|mixed|chopped|diced)\b/)) {
        return {
          unit: "cup",
          quantity: 1,
          unitOptions: ["cup", "bowl", "serving", "gram"],
          reasoning: "Mixed vegetables are best measured in cups"
        };
      } else {
        return {
          unit: "piece",
          quantity: 1,
          unitOptions: ["piece", "cup", "medium", "large", "gram"],
          reasoning: "Individual vegetables are counted as pieces"
        };
      }
    }
    
    // 7. MEAT & PROTEIN
    if (category.includes("meat") || category.includes("protein") ||
        name.match(/\b(chicken|mutton|fish|egg|paneer|tofu|beef|pork|prawns|crab)\b/)) {
      if (name.includes("curry") || name.includes("gravy")) {
        return {
          unit: "serving",
          quantity: 1,
          unitOptions: ["serving", "bowl", "cup", "gram"],
          reasoning: "Meat curries are served as portions"
        };
      } else {
        return {
          unit: "piece",
          quantity: 1,
          unitOptions: ["piece", "gram", "serving", "small", "medium", "large"],
          reasoning: "Meat items are typically counted as pieces or by weight"
        };
      }
    }
    
    // 8. SNACKS & PROCESSED FOODS
    if (category.includes("snack") || 
        name.match(/\b(biscuit|cookie|chips|namkeen|samosa|pakora|vada|bhajia|mathri|sev)\b/)) {
      const isHighCalorie = food.calories > 150;
      return {
        unit: "piece",
        quantity: isHighCalorie ? 1 : 2,
        unitOptions: ["piece", "small pack", "gram", "handful"],
        reasoning: isHighCalorie ? "High-calorie snack, single piece recommended" : "Light snack, multiple pieces typical"
      };
    }
    
    // 9. DESSERTS & SWEETS
    if (category.includes("dessert") || category.includes("sweet") ||
        name.match(/\b(cake|pastry|ice cream|laddu|gulab jamun|rasgulla|kheer|halwa|jalebi)\b/)) {
      if (name.includes("ice cream") || name.includes("frozen")) {
        return {
          unit: "scoop",
          quantity: 1,
          unitOptions: ["scoop", "cup", "serving", "small cup"],
          reasoning: "Ice cream is typically served in scoops"
        };
      } else if (name.includes("cake") || name.includes("pastry")) {
        return {
          unit: "slice",
          quantity: 1,
          unitOptions: ["slice", "piece", "small slice", "medium slice"],
          reasoning: "Cakes and pastries are served as slices"
        };
      } else {
        return {
          unit: "piece",
          quantity: 1,
          unitOptions: ["piece", "small", "medium", "serving"],
          reasoning: "Traditional sweets are counted as pieces"
        };
      }
    }
    
    // 10. NUTS & DRIED FRUITS
    if (name.match(/\b(almond|cashew|walnut|peanut|raisin|dates|dried|nuts)\b/)) {
      return {
        unit: "handful",
        quantity: 1,
        unitOptions: ["handful", "piece", "gram", "tablespoon"],
        reasoning: "Nuts and dried fruits are typically consumed in handfuls"
      };
    }
    
    // 11. PASTA & NOODLES
    if (name.match(/\b(pasta|noodles|spaghetti|macaroni|maggi|ramen)\b/)) {
      return {
        unit: "cup",
        quantity: 1,
        unitOptions: ["cup", "bowl", "serving", "plate"],
        reasoning: "Pasta and noodles are typically served in cups or bowls"
      };
    }
    
    // 12. PIZZA & FAST FOOD
    if (name.match(/\b(pizza|burger|sandwich|wrap|roll)\b/)) {
      if (name.includes("pizza")) {
        return {
          unit: "slice",
          quantity: 2,
          unitOptions: ["slice", "piece", "quarter", "half"],
          reasoning: "Pizza is typically consumed as slices"
        };
      } else {
        return {
          unit: "piece",
          quantity: 1,
          unitOptions: ["piece", "half", "quarter", "serving"],
          reasoning: "Fast food items are counted as pieces"
        };
      }
    }
    
    // Default intelligent suggestion
    return {
      unit: "serving",
      quantity: 1,
      unitOptions: ["serving", "gram", "piece"],
      reasoning: "Standard serving size recommended"
    };
  };

  const handleFoodSelect = useCallback(async (food: Food) => {
    setSelectedFood(food);
    onFoodSelect(food);
    
    // Get intelligent food analysis
    try {
      const suggestion = await getIntelligentFoodSuggestion(food);
      setUnit(suggestion.unit);
      setQuantity(suggestion.quantity);
    } catch (error) {
      console.log("Using local suggestion for", food.name);
      const localSuggestion = getIntelligentUnits(food);
      setUnit(localSuggestion.unit);
      setQuantity(localSuggestion.quantity);
    }
    
    // Clear search and hide suggestions
    setSearchQuery("");
    setShowSuggestions(false);
    
    // Clear any pending hide timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
  }, [onFoodSelect]);

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
    if (debouncedQuery.length > 0 && searchResults.length > 0) {
      setShowSuggestions(true);
    } else if (debouncedQuery.length === 0) {
      setShowSuggestions(false);
    }
  }, [searchResults, debouncedQuery]);

  // Debug logging
  useEffect(() => {
    const shouldShow = showSuggestions && debouncedQuery.length > 0 && searchResults.length > 0;
    console.log("Search debug:", {
      searchQuery,
      debouncedQuery,
      showSuggestions,
      searchResultsLength: searchResults.length,
      shouldShowSuggestions: shouldShow
    });
  }, [searchQuery, debouncedQuery, showSuggestions, searchResults.length]);

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
    const name = food.name.toLowerCase();
    const category = food.category?.toLowerCase() || "";
    
    // Base multipliers for common units
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
      
      // Volume-based
      "cup": 1.0,
      "bowl": 1.2,
      "small bowl": 0.8,
      "medium bowl": 1.0,
      "large bowl": 1.5,
      "glass": 1.0,
      "bottle": 1.5,
      "can": 1.0,
      
      // Portion descriptions
      "small portion": 0.7,
      "medium portion": 1.0,
      "large portion": 1.5,
      "handful": 0.3,
      
      // Measurement units
      "tablespoon": 0.1,
      "teaspoon": 0.03,
      "gram": 0.01,
      "ml": 0.004,
      
      // Package sizes
      "small pack": 0.6,
      "pack": 1.0,
      "plate": 1.2,
    };

    // Food-specific multiplier adjustments
    let multiplier = baseMultipliers[unit] || 1.0;
    
    // BEVERAGES - typically 1:1 ratio for cups
    if (category.includes("beverage") || name.match(/\b(tea|coffee|juice|milk|water)\b/)) {
      if (unit === "cup" || unit === "glass") multiplier = 1.0;
      if (unit === "bottle") multiplier = 2.0; // Standard bottle is 2 cups
      if (unit === "can") multiplier = 1.5; // Standard can is 1.5 cups
    }
    
    // FRUITS - piece size varies significantly
    if (category.includes("fruit") || name.match(/\b(apple|banana|orange|mango)\b/)) {
      if (unit === "piece") {
        if (name.includes("grape") || name.includes("berry")) multiplier = 0.1;
        else if (name.includes("banana") || name.includes("apple")) multiplier = 0.8;
        else if (name.includes("mango") || name.includes("orange")) multiplier = 1.0;
        else if (name.includes("watermelon") || name.includes("pineapple")) multiplier = 1.5;
      }
    }
    
    // BREAD & FLATBREADS
    if (name.match(/\b(roti|chapati|naan|bread|toast|dosa|idli)\b/)) {
      if (unit === "piece") {
        if (name.includes("naan") || name.includes("dosa")) multiplier = 1.0;
        else if (name.includes("roti") || name.includes("chapati")) multiplier = 0.6;
        else if (name.includes("idli") || name.includes("vada")) multiplier = 0.4;
      }
      if (unit === "slice" && name.includes("bread")) multiplier = 0.5;
    }
    
    // RICE & GRAINS
    if (name.match(/\b(rice|biryani|pulao|oats|quinoa)\b/)) {
      if (unit === "cup") multiplier = 1.0; // Standard cup is good measure
      if (unit === "bowl") multiplier = 1.2; // Bowl is slightly larger
    }
    
    // SNACKS - typically smaller pieces
    if (category.includes("snack") || name.match(/\b(biscuit|cookie|chips|namkeen)\b/)) {
      if (unit === "piece") {
        if (name.includes("chips")) multiplier = 0.1; // Single chip
        else if (name.includes("biscuit") || name.includes("cookie")) multiplier = 0.3;
        else if (name.includes("samosa") || name.includes("pakora")) multiplier = 0.5;
      }
      if (unit === "handful") multiplier = 0.4;
      if (unit === "small pack") multiplier = 0.8;
    }
    
    // DESSERTS & SWEETS
    if (category.includes("dessert") || name.match(/\b(cake|ice cream|sweet|laddu)\b/)) {
      if (unit === "slice" && name.includes("cake")) multiplier = 0.7;
      if (unit === "scoop" && name.includes("ice cream")) multiplier = 0.5;
      if (unit === "piece" && name.match(/\b(laddu|gulab jamun|rasgulla)\b/)) multiplier = 0.4;
    }
    
    // PIZZA - special case
    if (name.includes("pizza")) {
      if (unit === "slice") multiplier = 0.25; // 1/4 of medium pizza
      if (unit === "piece") multiplier = 1.0; // Whole pizza
    }
    
    // NUTS & DRIED FRUITS - typically consumed in small quantities
    if (name.match(/\b(nuts|almond|cashew|walnut|dried|raisin)\b/)) {
      if (unit === "handful") multiplier = 0.25;
      if (unit === "piece") multiplier = 0.05;
      if (unit === "tablespoon") multiplier = 0.15;
    }
    
    // PROTEIN FOODS
    if (name.match(/\b(chicken|fish|egg|meat|paneer)\b/)) {
      if (unit === "piece") {
        if (name.includes("egg")) multiplier = 0.8;
        else if (name.includes("chicken") && name.includes("piece")) multiplier = 1.2;
        else multiplier = 1.0;
      }
    }
    
    return Math.max(0.01, multiplier); // Ensure minimum multiplier
  };

  const handleAddToMeal = () => {
    if (!selectedFood) return;
    
    const mealItemData = {
      foodId: selectedFood.id,
      quantity: Math.max(0.1, Math.round(quantity * 10) / 10),
      unit,
      sessionId,
      date: selectedDate || new Date().toISOString().split('T')[0],
    };
    
    console.log("FoodSearch: Current unit value:", unit);
    console.log("FoodSearch: Complete meal item data:", mealItemData);
    console.log("FoodSearch: Sending meal item:", mealItemData);
    
    addMealMutation.mutate(mealItemData);
    
    // Clear selection after adding
    setSelectedFood(null);
    onFoodSelect(null);
    setQuantity(1);
    setUnit("serving");
  };

  const shouldShowSuggestions = showSuggestions && debouncedQuery.length > 0 && searchResults.length > 0;
  
  console.log("Search debug:", {
    searchQuery,
    debouncedQuery,
    showSuggestions,
    searchResultsLength: searchResults.length,
    shouldShowSuggestions
  });

  return (
    <Card className="search-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Food Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
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
            className="w-full"
          />
          
          {shouldShowSuggestions && (
            <div 
              className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking
            >
              {searchResults.map((food: Food, index) => {
                const isAiFood = food.name.includes("(Not Found)") || food.id === -1;
                return (
                  <div
                    key={`${food.id}-${index}`}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => handleFoodSelect(food)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{food.name}</span>
                          {isAiFood && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                          {food.realisticCalories ? (
                            <span>
                              <span className="font-medium text-green-600 dark:text-green-400">{food.realisticCalories} cal</span> 
                              <span className="text-gray-400 dark:text-gray-500"> ({food.smartQuantity} {food.smartUnit})</span> • {food.protein}g protein
                            </span>
                          ) : (
                            <span>{food.calories} cal • {food.protein}g protein</span>
                          )}
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                            {food.smartUnit || getIntelligentUnits(food).unit}
                          </span>
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
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {selectedFood.realisticCalories ? (
                    <>
                      <span className="text-green-600 dark:text-green-400 font-bold">{selectedFood.realisticCalories} cal</span> 
                      <span className="text-gray-500"> for {selectedFood.smartQuantity} {selectedFood.smartUnit}</span>
                      <br />
                      <span className="text-xs">Base: {selectedFood.calories} cal per {selectedFood.portionSize}</span>
                    </>
                  ) : (
                    <>Base: {selectedFood.calories} cal per {selectedFood.portionSize}</>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="bg-white/50">{selectedFood.category}</Badge>
            </div>
            
            {/* Intelligent Suggestion Display */}
            <div className="mb-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-md border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Suggestion</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFood.portionExplanation ? (
                  <>
                    <span className="font-medium">{selectedFood.portionExplanation}</span>
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
                <div className="relative">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        setQuantity(value);
                      } else if (e.target.value === "") {
                        setQuantity(1);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                        setQuantity(1);
                      }
                    }}
                    className="mt-1 bg-white dark:bg-gray-800 text-lg font-semibold h-12 text-center pr-16"
                    placeholder="1"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.round((prev + 0.5) * 10) / 10)}
                      className="w-6 h-4 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(0.1, Math.round((prev - 0.5) * 10) / 10))}
                      className="w-6 h-4 hover:bg-red-600 text-white text-xs rounded flex items-center justify-center transition-colors bg-[#8c9195]"
                    >
                      -
                    </button>
                  </div>
                </div>
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
                  {getIntelligentUnits(selectedFood).unitOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Enhanced Nutrition Display */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nutrition for {quantity} {unit}:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg border border-blue-300 dark:border-blue-700">
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {Math.round((selectedFood.calories || 0) * quantity * getUnitMultiplier(unit, selectedFood))}
                  </div>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Calories</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg border border-green-300 dark:border-green-700">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">
                    {Math.round((selectedFood.protein || 0) * quantity * getUnitMultiplier(unit, selectedFood) * 10) / 10}g
                  </div>
                  <div className="text-xs font-medium text-green-600 dark:text-green-400">Protein</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-lg border border-amber-300 dark:border-amber-700">
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {Math.round((selectedFood.carbs || 0) * quantity * getUnitMultiplier(unit, selectedFood) * 10) / 10}g
                  </div>
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Carbs</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg border border-red-300 dark:border-red-700">
                  <div className="text-xl font-bold text-red-700 dark:text-red-300">
                    {Math.round((selectedFood.fat || 0) * quantity * getUnitMultiplier(unit, selectedFood) * 10) / 10}g
                  </div>
                  <div className="text-xs font-medium text-red-600 dark:text-red-400">Fat</div>
                </div>
              </div>
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
    </Card>
  );
}
import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Food } from "@shared/schema";

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
  const [searchTrigger, setSearchTrigger] = useState(""); // Separate trigger for search
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [unitOptions, setUnitOptions] = useState<string[]>(["serving", "piece", "cup", "grams"]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [isManualSearch, setIsManualSearch] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchStats(null);
      return;
    }

    setIsLoading(true);
    setSearchTrigger(searchQuery);

    try {
      const response = await fetch(`/api/enhanced-food-search?q=${encodeURIComponent(searchQuery.trim())}&sessionId=${sessionId}&userId=${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          toast({
            title: "Search limit reached",
            description: data.message || "You've reached your daily search limit. Please upgrade to continue.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.searchResults && Array.isArray(data.searchResults)) {
        // Remove duplicates based on name and calories
        const uniqueResults = data.searchResults.filter((food: Food, index: number, self: Food[]) =>
          index === self.findIndex((f: Food) => 
            f.name.toLowerCase() === food.name.toLowerCase() && 
            Math.abs(f.calories - food.calories) < 5
          )
        );
        
        setSearchResults(uniqueResults);
        setSearchStats(data.searchStats || null);
      } else {
        setSearchResults([]);
        setSearchStats(null);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setSearchStats(null);
      toast({
        title: "Search failed",
        description: "Unable to search for foods. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sessionId, toast]);

  // Handle manual search button click
  const handleManualSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setIsManualSearch(true);
      handleSearch();
    }
  }, [searchQuery, handleSearch]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  }, [handleManualSearch]);

  // Auto-reset form after successful search
  useEffect(() => {
    if (searchResults.length > 0 && !editingFood?.isEditing) {
      setQuantity(1);
      setQuantityInput("1");
      
      // Set unit based on search results
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

  // Simple function to get unit options from the server
  const getUnitOptions = async (foodName: string, category: string = "") => {
    try {
      const response = await fetch(`/api/unit-selection/${encodeURIComponent(foodName)}?category=${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch unit options');
      }
      const data = await response.json();
      return data.unitOptions || ["serving", "piece", "cup", "grams"];
    } catch (error) {
      console.log("Unit options API failed:", error);
      return ["serving", "piece", "cup", "grams"];
    }
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
    
    // Use enhanced search results unit options if available (from enhanced search API)
    const enhancedFood = food as any;
    if (enhancedFood.unitOptions && Array.isArray(enhancedFood.unitOptions)) {
      setUnitOptions(enhancedFood.unitOptions);
      setUnit(enhancedFood.defaultUnit || enhancedFood.unitOptions[0] || "serving");
    } else {
      // Fallback to backend unit selection
      try {
        const unitOptions = await getUnitOptions(food.name, food.category);
        setUnitOptions(unitOptions);
        setUnit(unitOptions[0] || "serving");
      } catch (error) {
        console.log("Unit selection failed, using default:", error);
        setUnitOptions(["serving", "piece", "cup", "grams"]);
        setUnit("serving");
      }
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
        console.log(`Nuts piece calculation for ${name}: using multiplier ${multiplier} (should be ~${Math.round(multiplier * food.calories)} cal)`);
      }
    }
    
    console.log(`Final multiplier for ${name} - ${unit}: ${multiplier}`);
    return multiplier;
  };

  // Calculate nutrition values based on quantity and unit
  const calculateNutrition = (baseValue: number, quantity: number, unit: string, food: Food) => {
    const multiplier = getUnitMultiplier(unit, food);
    const result = baseValue * multiplier * quantity;
    console.log(`Nutrition calculation: ${baseValue} × ${multiplier} × ${quantity} = ${result}`);
    return Math.round(result * 10) / 10; // Round to 1 decimal place
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantityInput(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setQuantity(numValue);
    }
  };

  const handleAddToMeal = async () => {
    if (!selectedFood) return;
    
    const mealItem = {
      foodId: selectedFood.id,
      quantity: quantity,
      unit: unit,
      sessionId: sessionId,
      foodName: selectedFood.name,
      date: selectedDate || new Date().toISOString().split('T')[0]
    };
    
    addMealMutation.mutate(mealItem);
  };

  const nutritionDisplay = selectedFood ? {
    calories: calculateNutrition(selectedFood.calories, quantity, unit, selectedFood),
    protein: calculateNutrition(selectedFood.protein, quantity, unit, selectedFood),
    carbs: calculateNutrition(selectedFood.carbs, quantity, unit, selectedFood),
    fat: calculateNutrition(selectedFood.fat, quantity, unit, selectedFood),
  } : null;

  return (
    <Card className="search-container" data-food-search-card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Foods
          </span>
          {editingFood?.isEditing && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Edit2 className="w-3 h-3" />
              Editing
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleManualSearch}
              disabled={!searchQuery.trim() || isLoading}
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Search Results Dropdown */}
          {showSuggestions && searchTrigger.length > 0 && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((food: Food, index) => {
                const enhancedFood = food as any;
                
                return (
                  <div
                    key={`${food.id}-${index}`}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleFoodSelect(food)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{food.name}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(food.calories)} cal
                          {food.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {food.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {enhancedFood.accuracy && (
                          <div className="text-xs">
                            {enhancedFood.accuracy === 'high' && <Badge className="bg-green-100 text-green-800">✅ Verified</Badge>}
                            {enhancedFood.accuracy === 'medium' && <Badge className="bg-yellow-100 text-yellow-800">📊 Database</Badge>}
                            {enhancedFood.accuracy === 'low' && <Badge className="bg-blue-100 text-blue-800">🤖 AI-Generated</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Food Selection Form */}
        {selectedFood && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selectedFood.name}</h3>
              <Badge variant="outline">{selectedFood.category}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantityInput}
                  onChange={handleQuantityChange}
                  min="0.1"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Nutrition Display */}
            {nutritionDisplay && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                  <div className="font-semibold text-orange-600">{nutritionDisplay.calories}</div>
                  <div className="text-gray-600">Calories</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                  <div className="font-semibold text-blue-600">{nutritionDisplay.protein}g</div>
                  <div className="text-gray-600">Protein</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                  <div className="font-semibold text-green-600">{nutritionDisplay.carbs}g</div>
                  <div className="text-gray-600">Carbs</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded">
                  <div className="font-semibold text-purple-600">{nutritionDisplay.fat}g</div>
                  <div className="text-gray-600">Fat</div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleAddToMeal}
              disabled={addMealMutation.isPending}
              className="w-full"
            >
              {addMealMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Meal
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
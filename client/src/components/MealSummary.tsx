import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Utensils, Trash2, X, Target, Flame, CheckCircle, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateNutritionFromUnit, SmartPortionData } from "@shared/unitCalculations";
import type { MealItemWithFood, UserProfile, Exercise } from "@shared/schema";

interface MealSummaryProps {
  sessionId: string;
  selectedDate?: string;
  onSubmit: () => void;
  onClear: () => void;
  isSubmitting: boolean;
  isClearing: boolean;
  onEditMeal?: (mealItem: MealItemWithFood) => void;
}

export default function MealSummary({ 
  sessionId, 
  selectedDate,
  onSubmit, 
  onClear, 
  isSubmitting, 
  isClearing,
  onEditMeal
}: MealSummaryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log(`MealSummary: Querying meals for session ${sessionId} on date ${selectedDate}`);
  
  const { data: mealItems = [], isLoading } = useQuery<MealItemWithFood[]>({
    queryKey: [`/api/meal/${sessionId}/${selectedDate}`],
    staleTime: 0, // Force fresh data
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: [`/api/profile/${sessionId}`],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: [`/api/exercise/${sessionId}`],
  });

  const removeMealItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDate}`] });
      toast({
        title: "Success",
        description: "Item removed from meal",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const clearMealMutation = useMutation({
    mutationFn: async () => {
      const targetDate = selectedDate || new Date().toISOString().split('T')[0];
      await apiRequest("DELETE", `/api/meal/clear/${sessionId}/${targetDate}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDate}`] });
      const targetDate = selectedDate || new Date().toISOString().split('T')[0];
      toast({
        title: "Meal Cleared",
        description: `All items removed from ${targetDate === new Date().toISOString().split('T')[0] ? "today's" : targetDate + "'s"} meal.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear meal",
        variant: "destructive",
      });
    },
  });

  const submitMealMutation = useMutation({
    mutationFn: async () => {
      const targetDate = selectedDate || new Date().toISOString().split('T')[0]; // Use selected date or today
      const totalCaloriesBurned = exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
      
      // Get existing daily summary to append to instead of replacing
      let existingSummary = null;
      try {
        const existingSummaryResponse = await fetch(`/api/daily-summary/${sessionId}/${targetDate}`);
        if (existingSummaryResponse.ok) {
          const summaryData = await existingSummaryResponse.json();
          // Only use existing summary if it has actual data (not null response)
          if (summaryData && summaryData.id) {
            existingSummary = summaryData;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch existing summary:", error);
      }
      
      let combinedMealData = [...mealItems]; // Start with current meal items
      let combinedTotals = {
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat
      };
      
      // If there's existing data, combine it with new meals
      if (existingSummary && existingSummary.mealData) {
        try {
          const existingMeals = JSON.parse(existingSummary.mealData);
          if (Array.isArray(existingMeals) && existingMeals.length > 0) {
            combinedMealData = [...existingMeals, ...mealItems];
            
            // Simply add existing totals to new totals
            combinedTotals.calories += (existingSummary.totalCalories || 0);
            combinedTotals.protein += (existingSummary.totalProtein || 0);
            combinedTotals.carbs += (existingSummary.totalCarbs || 0);
            combinedTotals.fat += (existingSummary.totalFat || 0);
          }
        } catch (error) {
          console.warn("Failed to parse existing meal data:", error);
        }
      }
      
      const dailySummary = {
        sessionId,
        date: targetDate,
        totalCalories: Math.round(combinedTotals.calories * 100) / 100,
        totalProtein: Math.round(combinedTotals.protein * 100) / 100,
        totalCarbs: Math.round(combinedTotals.carbs * 100) / 100,
        totalFat: Math.round(combinedTotals.fat * 100) / 100,
        caloriesBurned: totalCaloriesBurned,
        netCalories: Math.round((combinedTotals.calories - totalCaloriesBurned) * 100) / 100,
        mealData: JSON.stringify(combinedMealData)
      };
      
      console.log("Submitting daily summary:", dailySummary);
      const result = await apiRequest("POST", "/api/daily-summary", dailySummary);
      console.log("Daily summary submission result:", result);
      return result;
    },
    onSuccess: async () => {
      const targetDate = selectedDate || new Date().toISOString().split('T')[0];
      
      // Clear current meal items after submission - this clears the "Current Meal" section
      // but preserves the data in the daily summary for historical tracking
      await apiRequest(`/api/meal/clear/${sessionId}/${targetDate}`, {
        method: "POST",
      });
      
      // Invalidate all relevant queries to refresh the UI with updated daily summary
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${targetDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${targetDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/user-progress`] });
      
      toast({
        title: "Success",
        description: "Meal submitted successfully! Current meal cleared.",
      });
    },
    onError: (error: any) => {
      console.error("Meal submission error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate nutrition totals using accurate unit-to-gram system
  const totals = mealItems.reduce(
    (acc, item) => {
      // PRIORITY 1: Use frontend-calculated nutrition values if stored
      if (item.frontendCalories && item.frontendProtein && item.frontendCarbs && item.frontendFat) {
        console.log(`Using stored frontend nutrition for ${item.food.name}: ${item.frontendCalories} cal`);
        acc.calories += item.frontendCalories;
        acc.protein += item.frontendProtein;
        acc.carbs += item.frontendCarbs;
        acc.fat += item.frontendFat;
        return acc;
      }
      
      // PRIORITY 2: Calculate nutrition if frontend values not stored
      const basePer100g = {
        calories: item.food.calories,
        protein: item.food.protein,
        carbs: item.food.carbs,
        fat: item.food.fat
      };
      
      // Create smart portion data if available from AI detection
      const smartPortion = item.food.smartPortionGrams ? {
        smartPortionGrams: item.food.smartPortionGrams,
        smartCalories: item.food.smartCalories || undefined,
        smartProtein: item.food.smartProtein || undefined,
        smartCarbs: item.food.smartCarbs || undefined,
        smartFat: item.food.smartFat || undefined,
        aiConfidence: item.food.aiConfidence || undefined
      } as SmartPortionData : undefined;
      
      const calculatedNutrition = calculateNutritionFromUnit(
        item.food.name,
        item.unit,
        item.quantity,
        basePer100g,
        // @ts-ignore - Type mismatch between database null and interface undefined
        smartPortion
      );
      
      // Use smart calories if available, otherwise use calculated nutrition
      const finalCalories = item.food.smartPortionGrams && item.food.smartCalories ? 
        item.food.smartCalories : calculatedNutrition.calories;
      const finalProtein = item.food.smartPortionGrams && item.food.smartProtein ? 
        item.food.smartProtein : calculatedNutrition.protein;
      const finalCarbs = item.food.smartPortionGrams && item.food.smartCarbs ? 
        item.food.smartCarbs : calculatedNutrition.carbs;
      const finalFat = item.food.smartPortionGrams && item.food.smartFat ? 
        item.food.smartFat : calculatedNutrition.fat;
      
      acc.calories += finalCalories;
      acc.protein += finalProtein;
      acc.carbs += finalCarbs;
      acc.fat += finalFat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate total calories burned from exercises
  const totalCaloriesBurned = exercises.reduce((acc, exercise) => acc + exercise.caloriesBurned, 0);

  // Get target calories from user profile
  const targetCalories = userProfile?.targetCalories || 2000;
  const netCalories = totals.calories - totalCaloriesBurned;
  const progressPercentage = Math.min((netCalories / targetCalories) * 100, 100);
  const isOverTarget = netCalories > targetCalories;

  function getMultiplier(unit: string, food: any) {
    const unitLower = unit.toLowerCase();
    const name = food.name.toLowerCase();
    
    // Water always has 0 calories regardless of unit or quantity
    if (name.includes("water")) {
      return 0;
    }
    
    // PRIORITY 1: Extract volume/weight from unit descriptions for accurate calculations
    
    // VOLUME-BASED UNITS (for beverages) - Extract ml and calculate based on 100ml base
    const mlMatch = unitLower.match(/(\d+)ml/);
    if (mlMatch) {
      const mlAmount = parseInt(mlMatch[1]);
      console.log(`MealSummary - Volume calculation: ${mlAmount}ml = ${mlAmount/100}x multiplier for ${name}`);
      return mlAmount / 100; // Base nutrition is per 100ml
    }
    
    // WEIGHT-BASED UNITS (for solid foods) - Extract grams and calculate based on 100g base
    const gMatch = unitLower.match(/(\d+)g\)/);
    if (gMatch) {
      const gAmount = parseInt(gMatch[1]);
      console.log(`MealSummary - Weight calculation: ${gAmount}g = ${gAmount/100}x multiplier for ${name}`);
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
    const unitMultipliers: Record<string, number> = {
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
      "small portion": 0.7,
      "medium portion": 1.0,
      "large portion": 1.5,
      "handful": 0.3,
      
      // Measurement units
      "tablespoon": 0.15,
      "teaspoon": 0.05,
      "ml": 0.01,
      "gram": 0.01, // 1 gram = 1% of 100g base
      "g": 0.01,
    };

    // NUTS & TRAIL MIXES - Enhanced piece-based calculations
    if (name.match(/\b(nuts|nut|trail|mix|almond|cashew|peanut|walnut|pistachio|mixed nuts)\b/)) {
      // For nuts, "piece" should be much smaller than handful
      if (unitLower.includes("piece")) {
        // Single nuts are very small portions compared to base 100g
        let nutMultiplier = 0.015; // Default for mixed nuts
        if (name.includes("cashew")) nutMultiplier = 0.015; // ~1.5g per cashew
        else if (name.includes("almond")) nutMultiplier = 0.012; // ~1.2g per almond  
        else if (name.includes("peanut")) nutMultiplier = 0.008; // ~0.8g per peanut
        else if (name.includes("walnut")) nutMultiplier = 0.025; // ~2.5g per walnut half
        console.log(`MealSummary nuts piece calculation for ${name}: using multiplier ${nutMultiplier} (should be ~${Math.round(food.calories * nutMultiplier)} cal per piece)`);
        return nutMultiplier; // Return immediately to avoid other calculations overriding
      }
      // Handful calculations already handled by weight extraction above
    }

    // MEAT & PROTEIN - Enhanced piece-based calculations for consistent portioning
    if (name.match(/\b(chicken|mutton|fish|beef|pork|lamb|turkey|duck)\b/) && unitLower.includes("piece")) {
      // Meat pieces should be realistic portions - not too large or too small
      let meatMultiplier = 0.75; // Default meat piece ~75g
      if (name.includes("chicken")) meatMultiplier = 0.8; // Chicken piece ~80g
      else if (name.includes("fish")) meatMultiplier = 1.0; // Fish piece ~100g
      else if (name.includes("pork")) meatMultiplier = 0.75; // Pork piece ~75g  
      else if (name.includes("beef")) meatMultiplier = 0.9; // Beef piece ~90g
      console.log(`MealSummary meat piece calculation for ${name}: using multiplier ${meatMultiplier} (should be ~${Math.round(food.calories * meatMultiplier)} cal per piece)`);
      return meatMultiplier;
    }

    // Food-specific adjustments
    if (food.category === "snacks" && unit === "piece") {
      return 0.5; // Individual snacks are smaller
    }
    if (food.category === "beverages" && unit === "cup") {
      return 1.0; // Beverages are typically per cup
    }
    if (food.name.toLowerCase().includes("cake") && unit === "slice") {
      return 0.8; // Cake slice is reasonable portion
    }
    if (food.name.toLowerCase().includes("pizza") && unit === "slice") {
      return 0.3; // Pizza slice is smaller than whole
    }
    
    return unitMultipliers[unit] || 1.0;
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Utensils className="w-5 h-5 text-primary mr-2" />
            Current Meal
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearMealMutation.mutate()}
            disabled={clearMealMutation.isPending || mealItems.length === 0}
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Remove item if inaccurate and add from Food Search above
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meal Items */}
        <div className="space-y-3">
          {mealItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items in your meal yet.</p>
              <p className="text-sm">Add some foods to get started!</p>
            </div>
          ) : (
            mealItems.map((item) => (
              <div
                key={item.id}
                className="bg-muted/50 p-3 rounded-lg border border-border animate-slide-up"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.food.name}</div>
                    {(() => {
                      // PRIORITY 1: Use stored frontend-calculated nutrition values if available
                      if (item.frontendCalories && item.frontendTotalGrams) {
                        return (
                          <>
                            <div className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit} ({item.frontendTotalGrams}g total)
                            </div>
                            <div className="text-xs text-primary mt-1 font-semibold">
                              {item.frontendCalories} cal
                              <span className="text-green-600 ml-1 text-[10px]">
                                (✓ exact from search)
                              </span>
                            </div>
                          </>
                        );
                      }
                      
                      // PRIORITY 2: Calculate nutrition if frontend values not stored
                      const basePer100g = {
                        calories: item.food.calories,
                        protein: item.food.protein,
                        carbs: item.food.carbs,
                        fat: item.food.fat
                      };
                      
                      // Include smart portion data if available from AI detection
                      const smartPortion = item.food.smartPortionGrams ? {
                        smartPortionGrams: item.food.smartPortionGrams,
                        smartCalories: item.food.smartCalories,
                        smartProtein: item.food.smartProtein,
                        smartCarbs: item.food.smartCarbs,
                        smartFat: item.food.smartFat,
                        aiConfidence: item.food.aiConfidence
                      } : undefined;
                      
                      const calculatedNutrition = calculateNutritionFromUnit(
                        item.food.name,
                        item.unit,
                        item.quantity,
                        basePer100g,
                        smartPortion
                      );
                      
                      return (
                        <>
                          <div className="text-xs text-muted-foreground">
                            {/* Show smart portion data if available, otherwise show calculated nutrition */}
                            {item.food.smartPortionGrams && item.food.smartCalories ? (
                              <>
                                {item.quantity} {item.unit} (AI detected: {item.food.smartPortionGrams}g = {item.food.smartCalories} cal)
                              </>
                            ) : (
                              <>
                                {item.quantity} {item.unit} ({calculatedNutrition.gramEquivalent})
                              </>
                            )}
                          </div>
                          <div className="text-xs text-primary mt-1">
                            {/* Use smart calories if available, otherwise use calculated nutrition */}
                            {item.food.smartPortionGrams && item.food.smartCalories ? 
                              item.food.smartCalories : calculatedNutrition.calories} cal
                            {item.food.aiConfidence && (
                              <span className="text-green-600 ml-1 text-[10px]">
                                ({item.food.aiConfidence}% confidence)
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMeal?.(item)}
                      className="edit-meal-button text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 p-1"
                      title="Edit this meal item"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMealItemMutation.mutate(item.id)}
                      disabled={removeMealItemMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1"
                      title="Remove this meal item"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Nutrition Summary */}
        {mealItems.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(totals.calories)}
                </div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {Math.round(totals.protein)}g
                </div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {Math.round(totals.carbs)}g
                </div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {Math.round(totals.fat)}g
                </div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Meal Button */}
        {mealItems.length > 0 && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex gap-2">
              <Button
                onClick={() => submitMealMutation.mutate()}
                disabled={submitMealMutation.isPending || mealItems.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {submitMealMutation.isPending ? "Submitting..." : "Submit Meal"}
              </Button>
              <Button
                variant="outline"
                onClick={() => clearMealMutation.mutate()}
                disabled={clearMealMutation.isPending || mealItems.length === 0}
                className="px-3"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

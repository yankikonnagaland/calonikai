import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Utensils, Trash2, X, Target, Flame, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MealItemWithFood, UserProfile, Exercise } from "@shared/schema";

interface MealSummaryProps {
  sessionId: string;
  selectedDate?: string;
  onSubmit: () => void;
  onClear: () => void;
  isSubmitting: boolean;
  isClearing: boolean;
}

export default function MealSummary({ 
  sessionId, 
  selectedDate,
  onSubmit, 
  onClear, 
  isSubmitting, 
  isClearing 
}: MealSummaryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log(`MealSummary: Querying meals for session ${sessionId} on date ${selectedDate}`);
  
  const { data: mealItems = [], isLoading } = useQuery<MealItemWithFood[]>({
    queryKey: [`/api/meal/${sessionId}/${selectedDate}`],
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: [`/api/profile/${sessionId}`],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: [`/api/exercise/${sessionId}`],
  });

  const removeMealItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/meal/${id}`, { method: "DELETE" });
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
      
      // First clear the meal for the specific date, then invalidate queries
      try {
        await apiRequest("DELETE", `/api/meal/clear/${sessionId}/${targetDate}`);
        console.log("Meal cleared successfully after submission for date:", targetDate);
      } catch (error) {
        console.error("Error clearing meal after submission:", error);
      }
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${targetDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${targetDate}`] });
      
      toast({
        title: "Success",
        description: "Meal submitted and current meal cleared",
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

  // Calculate nutrition totals
  const totals = mealItems.reduce(
    (acc, item) => {
      const multiplier = getMultiplier(item.unit, item.food);
      acc.calories += item.food.calories * item.quantity * multiplier;
      acc.protein += item.food.protein * item.quantity * multiplier;
      acc.carbs += item.food.carbs * item.quantity * multiplier;
      acc.fat += item.food.fat * item.quantity * multiplier;
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
    // Standard portion size multipliers
    const unitMultipliers: Record<string, number> = {
      "serving": 1.0,
      "piece": 0.8,
      "slice": 0.6,
      "small portion": 0.7,
      "medium portion": 1.0,
      "large portion": 1.5,
      "cup": 1.2,
      "tablespoon": 0.1,
      "teaspoon": 0.03,
      "gram": 0.01, // Per gram vs 100g base
    };

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
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="text-xs text-primary mt-1">
                      {Math.round(item.food.calories * item.quantity * getMultiplier(item.unit, item.food))} cal
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMealItemMutation.mutate(item.id)}
                    disabled={removeMealItemMutation.isPending}
                    className="text-destructive hover:text-destructive/80 p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
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

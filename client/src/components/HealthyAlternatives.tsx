import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Apple } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MealItemWithFood } from "@shared/schema";

interface HealthyAlternativesProps {
  sessionId: string;
}

interface Alternative {
  name: string;
  calorieDiff: number;
  reason: string;
}

interface AlternativesResponse {
  alternatives: Alternative[];
  tip: string;
}

export default function HealthyAlternatives({ sessionId }: HealthyAlternativesProps) {
  const { data: mealItems = [] } = useQuery<MealItemWithFood[]>({
    queryKey: [`/api/meal/${sessionId}`],
  });

  const { data: alternativesData } = useQuery<AlternativesResponse>({
    queryKey: ["/api/alternatives", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/alternatives?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alternatives');
      }
      return response.json();
    },
    enabled: mealItems.length > 0,
  });

  // Calculate meal totals
  const totals = mealItems.reduce(
    (acc, item) => {
      const multiplier = 0.01; // Assuming grams to 100g conversion
      const itemCalories = item.food.calories * item.quantity * multiplier;
      
      return {
        calories: acc.calories + itemCalories,
        protein: acc.protein + (item.food.protein * item.quantity * multiplier),
        carbs: acc.carbs + (item.food.carbs * item.quantity * multiplier),
        fat: acc.fat + (item.food.fat * item.quantity * multiplier),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Generate meal-based healthy suggestions
  const generateMealSuggestions = () => {
    const suggestions = [];
    
    // High calorie meal suggestions
    if (totals.calories > 800) {
      suggestions.push({
        name: "Reduce Portion Sizes",
        calorieDiff: -Math.round(totals.calories * 0.2),
        reason: "Try smaller portions to reduce overall calories"
      });
    }
    
    // High carb meal suggestions
    if (totals.carbs > 60) {
      suggestions.push({
        name: "Replace Rice with Cauliflower Rice",
        calorieDiff: -120,
        reason: "Lower carbs and calories while maintaining texture"
      });
    }
    
    // High fat meal suggestions
    if (totals.fat > 25) {
      suggestions.push({
        name: "Use Less Oil in Cooking",
        calorieDiff: -80,
        reason: "Steam or grill instead of frying"
      });
    }
    
    // Low protein suggestions
    if (totals.protein < 20) {
      suggestions.push({
        name: "Add Grilled Chicken or Paneer",
        calorieDiff: 150,
        reason: "Boost protein for better satiety"
      });
    }
    
    // General healthy additions
    suggestions.push({
      name: "Add More Vegetables",
      calorieDiff: 25,
      reason: "Increase fiber and nutrients"
    });
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  if (mealItems.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Apple className="w-5 h-5 text-green-500 mr-2" />
            Healthy Meal Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Apple className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Add foods to your meal to see healthy alternatives!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mealSuggestions = generateMealSuggestions();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Apple className="w-5 h-5 text-green-500 mr-2" />
          Healthy Meal Improvements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Meal Overview */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{Math.round(totals.calories)}</div>
              <div className="text-xs text-muted-foreground">Total Calories</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{Math.round(totals.protein)}g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
            </div>
          </div>

          {/* Meal Suggestions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center">
              <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
              Suggestions for Your Current Meal
            </h4>
            {mealSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 dark:text-green-200">{suggestion.name}</h4>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">{suggestion.reason}</p>
                  </div>
                  <div className="flex items-center ml-4">
                    <Badge variant={suggestion.calorieDiff < 0 ? "destructive" : "secondary"} className="text-xs">
                      {suggestion.calorieDiff > 0 ? '+' : ''}{suggestion.calorieDiff} cal
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* General tip */}
          {alternativesData && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <Lightbulb className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">{alternativesData.tip}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
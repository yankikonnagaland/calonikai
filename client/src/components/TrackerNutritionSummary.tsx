import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Utensils, Activity, Flame, Scale, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DailySummary, Exercise, DailyWeight } from "@shared/schema";

interface TrackerNutritionSummaryProps {
  sessionId: string;
  selectedDate?: string;
}

export default function TrackerNutritionSummary({ sessionId, selectedDate }: TrackerNutritionSummaryProps) {
  const today = new Date().toISOString().split('T')[0];
  const currentDate = selectedDate || today;
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todayExercises = [] } = useQuery<Exercise[]>({
    queryKey: [`/api/exercise/${sessionId}`],
  });

  const { data: currentSummary } = useQuery<DailySummary>({
    queryKey: [`/api/daily-summary/${sessionId}/${currentDate}`],
  });

  const { data: profile } = useQuery<any>({
    queryKey: [`/api/profile/${sessionId}`],
  });

  // Fetch weight for current date
  const { data: currentDateWeight } = useQuery<DailyWeight | null>({
    queryKey: [`/api/daily-weight/${sessionId}/${currentDate}`],
  });
  
  // Log weight data for debugging
  console.log(`Weight data for ${currentDate}:`, currentDateWeight);

  // Calculate current date's nutrition data
  const currentCaloriesIn = Math.round((currentSummary?.totalCalories || 0) * 100) / 100;
  const currentCaloriesOut = Math.round(todayExercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0) * 100) / 100;
  const netCalories = Math.round((currentCaloriesIn - currentCaloriesOut) * 100) / 100;
  const targetCalories = profile?.targetCalories || 2000;

  // Weight saving mutation
  const saveWeightMutation = useMutation({
    mutationFn: async (weight: number) => {
      return await apiRequest("POST", "/api/daily-weight", {
        sessionId,
        weight,
        date: currentDate
      });
    },
    onSuccess: () => {
      toast({
        title: "Weight Saved",
        description: `Weight logged for ${new Date(currentDate).toLocaleDateString()}`,
      });
      // Invalidate all weight-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/daily-weight/${sessionId}/${currentDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-weights/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${currentDate}`] });
      setIsWeightModalOpen(false);
      setWeightInput("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save weight",
        variant: "destructive",
      });
    }
  });

  const handleSaveWeight = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight",
        variant: "destructive",
      });
      return;
    }
    saveWeightMutation.mutate(weight);
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Target className="w-5 h-5 mr-3 text-primary" />
          {currentDate === today ? "Today's Nutrition Summary" : "Nutrition Summary"}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {new Date(currentDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories In vs Out + Weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <Utensils className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Calories In</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">{currentCaloriesIn}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Calories Out</p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-200">{currentCaloriesOut}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            netCalories > targetCalories 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                netCalories > targetCalories 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Flame className={`w-4 h-4 ${
                  netCalories > targetCalories ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  netCalories > targetCalories 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>Net Calories</p>
                <p className={`text-xl font-bold ${
                  netCalories > targetCalories 
                    ? 'text-red-800 dark:text-red-200' 
                    : 'text-blue-800 dark:text-blue-200'
                }`}>{netCalories}</p>
              </div>
            </div>
          </div>
          
          {/* Weight Card */}
          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                <Scale className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {currentDate === today ? "Today's Weight" : "Weight"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                    {(() => {
                      console.log('Weight display logic:', {
                        currentDateWeight,
                        currentDateWeightValue: currentDateWeight?.weight,
                        profileWeight: profile?.weight,
                        currentDate,
                        today
                      });
                      return currentDateWeight?.weight || profile?.weight || '--';
                    })()} kg
                  </p>
                  <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Log Weight for {new Date(currentDate).toLocaleDateString()}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            min="1"
                            max="500"
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            placeholder="Enter weight"
                            className="text-center text-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSaveWeight}
                            disabled={saveWeightMutation.isPending || !weightInput}
                            className="flex-1"
                          >
                            {saveWeightMutation.isPending ? "Saving..." : "Save Weight"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsWeightModalOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {!currentDateWeight?.weight && profile?.weight && currentDate !== today && (
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                    Using profile weight
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Calorie Goal Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentCaloriesIn} / {targetCalories} calories
            </span>
          </div>
          <Progress 
            value={Math.min(100, (currentCaloriesIn / targetCalories) * 100)} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{targetCalories}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
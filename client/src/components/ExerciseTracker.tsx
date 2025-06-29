import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame, Timer, Play, Pause, Square, CheckCircle, Clock, Brain, Zap, Activity, Search, Trash2, X, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Exercise, MealItemWithFood } from "@shared/schema";

interface ExerciseTrackerProps {
  sessionId: string;
  selectedDate?: string;
}

interface ExerciseType {
  type: string;
  name: string;
  caloriesPerMin: number;
  icon: string;
  color: string;
  intensity: "low" | "moderate" | "high";
}

interface AIExerciseAnalysis {
  exerciseName: string;
  baseCaloriesPerMin: number;
  suggestedDuration: number;
  intensityMultipliers: {
    low: number;
    moderate: number;
    high: number;
  };
  reasoning: string;
  category: string;
}

const exerciseTypes: ExerciseType[] = [
  { type: "running", name: "Running", caloriesPerMin: 10, icon: "🏃‍♂️", color: "red", intensity: "high" },
  { type: "walking", name: "Walking", caloriesPerMin: 5, icon: "🚶‍♂️", color: "blue", intensity: "low" },
  { type: "skipping", name: "Skipping", caloriesPerMin: 12, icon: "🪅", color: "pink", intensity: "high" },
  { type: "cycling", name: "Cycling", caloriesPerMin: 8, icon: "🚴‍♂️", color: "green", intensity: "moderate" },
  { type: "swimming", name: "Swimming", caloriesPerMin: 11, icon: "🏊‍♂️", color: "blue", intensity: "high" },
  { type: "strength", name: "Strength Training", caloriesPerMin: 6, icon: "💪", color: "orange", intensity: "moderate" }
];

export default function ExerciseTracker({ sessionId, selectedDate }: ExerciseTrackerProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Start/End time tracking
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Enhanced AI-powered exercise detection
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIExerciseAnalysis | null>(null);
  const [intensity, setIntensity] = useState<"low" | "moderate" | "high">("moderate");
  const [duration, setDuration] = useState(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIMode, setShowAIMode] = useState(false);
  
  // Enhanced fields for running, walking, cycling
  const [useEnhancedTracker, setUseEnhancedTracker] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | "">("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [intensityLevel, setIntensityLevel] = useState<'Sub 1' | 'Sub 2' | 'Sub 3'>('Sub 2');
  const [heartRate, setHeartRate] = useState<number | "">("");
  const [terrain, setTerrain] = useState("");
  const [usesSmartwatch, setUsesSmartwatch] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug logging for selectedDate
  console.log("ExerciseTracker - selectedDate prop:", selectedDate);

  const { data: mealItems = [] } = useQuery<MealItemWithFood[]>({
    queryKey: [`/api/meal/${sessionId}`],
  });

  // Fetch exercises for the selected date
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: [`/api/exercise/${sessionId}/${selectedDate || new Date().toISOString().split('T')[0]}`],
    enabled: !!sessionId,
  });

  // Exercise removal mutations
  const removeExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      await apiRequest("DELETE", `/api/exercise/${exerciseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/exercise/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/exercise/${sessionId}/${selectedDate || new Date().toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
      toast({
        title: "Exercise Removed",
        description: "Exercise has been removed from your log",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove exercise",
        variant: "destructive",
      });
    },
  });

  const clearExercisesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/exercise/clear/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/exercise/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/exercise/${sessionId}/${selectedDate || new Date().toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
      toast({
        title: "Exercises Cleared",
        description: `All exercises have been removed from ${selectedDate === new Date().toISOString().split('T')[0] ? "today" : new Date(selectedDate || new Date()).toLocaleDateString()}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear exercises",
        variant: "destructive",
      });
    },
  });



  // AI Exercise Analysis Function
  const analyzeExercise = async (query: string) => {
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai-exercise-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseDescription: query })
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze exercise");
      }
      
      const analysis = await response.json();
      setAiAnalysis(analysis);
      setDuration(analysis.suggestedDuration || 30);
    } catch (error) {
      // Fallback to local analysis
      const localAnalysis = getLocalExerciseAnalysis(query);
      setAiAnalysis(localAnalysis);
      setDuration(localAnalysis.suggestedDuration);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Local exercise analysis fallback
  const getLocalExerciseAnalysis = (query: string): AIExerciseAnalysis => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("run") || lowerQuery.includes("jog")) {
      return {
        exerciseName: "Running",
        baseCaloriesPerMin: 10,
        suggestedDuration: 30,
        intensityMultipliers: { low: 0.7, moderate: 1.0, high: 1.4 },
        reasoning: "Running is a high-intensity cardiovascular exercise that burns calories efficiently",
        category: "Cardio"
      };
    }
    
    if (lowerQuery.includes("walk")) {
      return {
        exerciseName: "Walking",
        baseCaloriesPerMin: 5,
        suggestedDuration: 45,
        intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.3 },
        reasoning: "Walking is a low-impact exercise suitable for all fitness levels",
        category: "Cardio"
      };
    }
    
    if (lowerQuery.includes("swim")) {
      return {
        exerciseName: "Swimming",
        baseCaloriesPerMin: 11,
        suggestedDuration: 30,
        intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.5 },
        reasoning: "Swimming is a full-body, low-impact exercise with high calorie burn",
        category: "Full Body"
      };
    }
    
    if (lowerQuery.includes("yoga") || lowerQuery.includes("stretch")) {
      return {
        exerciseName: "Yoga/Stretching",
        baseCaloriesPerMin: 3,
        suggestedDuration: 60,
        intensityMultipliers: { low: 0.9, moderate: 1.0, high: 1.2 },
        reasoning: "Yoga improves flexibility and provides moderate calorie burn with mental benefits",
        category: "Flexibility"
      };
    }
    
    if (lowerQuery.includes("bike") || lowerQuery.includes("cycle")) {
      return {
        exerciseName: "Cycling",
        baseCaloriesPerMin: 8,
        suggestedDuration: 40,
        intensityMultipliers: { low: 0.7, moderate: 1.0, high: 1.4 },
        reasoning: "Cycling is an excellent low-impact cardio exercise",
        category: "Cardio"
      };
    }
    
    // Generic exercise
    return {
      exerciseName: query,
      baseCaloriesPerMin: 6,
      suggestedDuration: 30,
      intensityMultipliers: { low: 0.8, moderate: 1.0, high: 1.3 },
      reasoning: "Moderate-intensity exercise with balanced calorie burn",
      category: "General"
    };
  };

  // Calculate total calories burned
  const calculateCalories = (exerciseDuration?: number) => {
    const actualDuration = exerciseDuration || duration;
    if (aiAnalysis) {
      return Math.round(
        aiAnalysis.baseCaloriesPerMin * 
        actualDuration * 
        aiAnalysis.intensityMultipliers[intensity]
      );
    }
    if (selectedExercise) {
      const multiplier = intensity === "low" ? 0.8 : intensity === "high" ? 1.3 : 1.0;
      return Math.round(selectedExercise.caloriesPerMin * actualDuration * multiplier);
    }
    return 0;
  };

  const handleStartTracking = () => {
    const now = new Date();
    setStartTime(now);
    setEndTime(null);
    setIsTracking(true);
    setManualTime(""); // Clear manual time when starting tracking
  };

  const handleEndTracking = () => {
    const now = new Date();
    setEndTime(now);
    setIsTracking(false);
    
    if (startTime) {
      const durationInMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000);
      setManualTime(durationInMinutes.toString());
    }
  };

  const handleClearTimes = () => {
    setStartTime(null);
    setEndTime(null);
    setIsTracking(false);
    setManualTime("");
  };

  const getCalculatedDuration = () => {
    if (startTime && endTime) {
      return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    }
    if (startTime && isTracking) {
      const now = new Date();
      return Math.round((now.getTime() - startTime.getTime()) / 60000);
    }
    return 0;
  };

  const getFinalDuration = () => {
    // Manual time input overrides calculated duration
    if (manualTime && parseInt(manualTime) > 0) {
      return parseInt(manualTime);
    }
    return getCalculatedDuration();
  };

  const completeExerciseMutation = useMutation({
    mutationFn: async (data: { 
      sessionId: string; 
      type: string; 
      exerciseName: string; 
      duration: number; 
      caloriesBurned: number; 
      date: string;
      distanceKm?: number;
      durationMin?: number;
      intensityLevel?: 'Sub 1' | 'Sub 2' | 'Sub 3';
      heartRate?: number;
      terrain?: string;
      usesSmartwatch?: boolean;
    }) => {
      return apiRequest("POST", "/api/exercise", data);
    },
    onSuccess: () => {
      // Invalidate exercise queries to refresh both sections
      queryClient.invalidateQueries({ queryKey: [`/api/exercise/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/exercise/${sessionId}/${selectedDate || new Date().toISOString().split('T')[0]}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
      
      toast({
        title: "Exercise Completed!",
        description: "Great job! Keep up the good work.",
      });
      
      // Reset form
      setSeconds(0);
      setIsTimerRunning(false);
      setShowTimer(false);
      setSelectedExercise(null);
      setManualTime("");
      setAiAnalysis(null);
      setExerciseQuery("");
      handleClearTimes();
      // Reset enhanced fields
      setDistanceKm("");
      setDurationMin("");
      setIntensityLevel('Sub 2');
      setHeartRate("");
      setTerrain("");
      setUsesSmartwatch(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log exercise",
        variant: "destructive",
      });
    },
  });

  // Calculate total meal calories
  const mealCalories = mealItems.reduce((total, item) => {
    const multiplier = getMultiplier(item.unit, item.food);
    return total + (item.food.calories * item.quantity * multiplier);
  }, 0);

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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleExerciseSelect = (exercise: ExerciseType) => {
    setSelectedExercise(exercise);
    setShowTimer(false);
    setSeconds(0);
    setIsTimerRunning(false);
    setManualTime("");
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleStopTimer = () => {
    if (seconds > 0 && selectedExercise) {
      const timerDuration = Math.floor(seconds / 60);
      if (timerDuration > 0) {
        const caloriesBurned = calculateCalories(timerDuration);
        const exerciseData: any = {
          sessionId,
          type: selectedExercise.type,
          exerciseName: selectedExercise.name,
          duration: timerDuration,
          caloriesBurned,
          date: selectedDate || new Date().toISOString().split('T')[0],
        };

        // Add enhanced fields for running, walking, cycling
        if (['running', 'walking', 'cycling'].includes(selectedExercise.type)) {
          if (distanceKm) exerciseData.distanceKm = Number(distanceKm);
          exerciseData.intensityLevel = intensityLevel;
          if (heartRate) exerciseData.heartRate = Number(heartRate);
          if (terrain) exerciseData.terrain = terrain;
          exerciseData.usesSmartwatch = usesSmartwatch;
        }

        completeExerciseMutation.mutate(exerciseData);
      } else {
        toast({
          title: "Exercise too short",
          description: "Please exercise for at least 1 minute to log it",
          variant: "destructive",
        });
      }
    }
    setSeconds(0);
    setIsTimerRunning(false);
    setShowTimer(false);
  };

  const handleManualTimeSubmit = () => {
    if (!selectedExercise) {
      toast({
        title: "Missing Information",
        description: "Please select an exercise first",
        variant: "destructive",
      });
      return;
    }

    const duration = getFinalDuration();
    if (duration <= 0) {
      toast({
        title: "Invalid Time",
        description: "Please enter duration manually or use start/end time tracking",
        variant: "destructive",
      });
      return;
    }

    const caloriesBurned = calculateCalories(duration);
    const exerciseData: any = {
      sessionId,
      type: selectedExercise.type,
      exerciseName: selectedExercise.name,
      duration,
      caloriesBurned,
      date: selectedDate || new Date().toISOString().split('T')[0],
    };

    // Add enhanced fields for running, walking, cycling
    if (['running', 'walking', 'cycling'].includes(selectedExercise.type)) {
      if (distanceKm) exerciseData.distanceKm = Number(distanceKm);
      exerciseData.intensityLevel = intensityLevel;
      if (heartRate) exerciseData.heartRate = Number(heartRate);
      if (terrain) exerciseData.terrain = terrain;
      exerciseData.usesSmartwatch = usesSmartwatch;
    }

    completeExerciseMutation.mutate(exerciseData);

    setManualTime("");
    setShowManualInput(false);
    handleClearTimes();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeNeeded = (exercise: ExerciseType) => {
    if (mealCalories === 0) return 0;
    return Math.ceil(mealCalories / exercise.caloriesPerMin);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* AI-Powered Exercise Input */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Brain className="w-6 h-6 text-purple-600 mr-3" />
            AI Exercise Detection
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Describe any exercise in natural language for intelligent analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="e.g., '45 minutes of intense cardio' or 'light stretching session'"
                value={exerciseQuery}
                onChange={(e) => setExerciseQuery(e.target.value)}
                className="flex-1 h-12 text-base"
                onKeyPress={(e) => e.key === 'Enter' && analyzeExercise(exerciseQuery)}
              />
              <Button 
                onClick={() => analyzeExercise(exerciseQuery)}
                disabled={!exerciseQuery.trim() || isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12 px-6"
              >
                {isAnalyzing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* AI Analysis Results */}
            {aiAnalysis && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">AI Analysis Complete</span>
                  <Badge variant="outline" className="text-xs">{aiAnalysis.category}</Badge>
                </div>
                <h4 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">
                  {aiAnalysis.exerciseName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {aiAnalysis.reasoning}
                </p>
                
                {/* Exercise Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Duration (minutes):</Label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                      min="1"
                      max="300"
                      className="h-12 text-lg font-medium"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Intensity Level:</Label>
                    <select
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value as "low" | "moderate" | "high")}
                      className="w-full h-12 px-4 border border-input rounded-md bg-background text-lg font-medium"
                    >
                      <option value="low">Low Intensity (×{aiAnalysis.intensityMultipliers.low})</option>
                      <option value="moderate">Moderate Intensity (×{aiAnalysis.intensityMultipliers.moderate})</option>
                      <option value="high">High Intensity (×{aiAnalysis.intensityMultipliers.high})</option>
                    </select>
                  </div>
                </div>

                {/* Calorie Calculation Display */}
                <div className="p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Estimated Calories Burned:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {calculateCalories()} cal
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {aiAnalysis.baseCaloriesPerMin} cal/min × {duration} min × {aiAnalysis.intensityMultipliers[intensity]} ({intensity})
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    const caloriesBurned = calculateCalories(duration);
                    completeExerciseMutation.mutate({
                      sessionId,
                      type: aiAnalysis.exerciseName.toLowerCase(),
                      exerciseName: aiAnalysis.exerciseName,
                      duration,
                      caloriesBurned,
                      date: selectedDate || new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg font-semibold"
                  disabled={completeExerciseMutation.isPending}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Log {duration} min of {aiAnalysis.exerciseName}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simple Quick Exercise Selection */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            Quick Exercise Log
          </CardTitle>
          <p className="text-sm text-muted-foreground">Select an exercise and enter duration</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Exercise Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exerciseTypes.map((exercise) => (
                <Button
                  key={exercise.type}
                  variant={selectedExercise?.type === exercise.type ? "default" : "outline"}
                  className={`h-16 flex flex-col items-center justify-center gap-1 ${
                    selectedExercise?.type === exercise.type 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  }`}
                  onClick={() => handleExerciseSelect(exercise)}
                >
                  <span className="text-lg">{exercise.icon}</span>
                  <span className="text-xs font-medium">{exercise.name}</span>
                </Button>
              ))}
            </div>

            {/* Duration Input */}
            {selectedExercise && (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg">
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">{selectedExercise.icon}</span>
                    <h3 className="font-bold text-xl text-blue-800 dark:text-blue-200">{selectedExercise.name}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{selectedExercise.caloriesPerMin} cal/min base rate</p>
                  </div>
                  
                  {/* Enhanced Intensity Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-blue-800 dark:text-blue-200 block text-center">Exercise Intensity Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setIntensity(level)}
                          className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            intensity === level
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                              : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-102 border border-blue-200 dark:border-blue-700'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-lg">
                              {level === 'low' ? '😌' : level === 'moderate' ? '💪' : '🔥'}
                            </span>
                            <span className="capitalize">{level}</span>
                            <span className="text-xs opacity-75">
                              {level === "low" ? "0.8x" : level === "high" ? "1.3x" : "1.0x"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
                      Select intensity based on your effort level
                    </div>
                  </div>
                  
                  {/* Enhanced Fields for Running, Walking, Cycling */}
                  {['running', 'walking', 'cycling'].includes(selectedExercise.type) && (
                    <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                          Enhanced {selectedExercise.name} Tracking
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useEnhancedTracker}
                              onChange={(e) => setUseEnhancedTracker(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              useEnhancedTracker 
                                ? 'bg-purple-600' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                useEnhancedTracker ? 'translate-x-5' : 'translate-x-0.5'
                              } mt-0.5`}></div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      {useEnhancedTracker && (
                        <>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label htmlFor="distance" className="text-xs text-purple-600 dark:text-purple-400">Distance (km)</Label>
                              <Input
                                id="distance"
                                type="number"
                                step="0.1"
                                placeholder="Enter distance in km"
                                value={distanceKm}
                                onChange={(e) => setDistanceKm(e.target.value ? Number(e.target.value) : "")}
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                      
                          <div>
                            <Label className="text-xs text-purple-600 dark:text-purple-400">Intensity Level</Label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              {(['Sub 1', 'Sub 2', 'Sub 3'] as const).map((level) => (
                                <button
                                  key={level}
                                  onClick={() => setIntensityLevel(level)}
                                  className={`p-2 rounded text-xs font-medium transition-all ${
                                    intensityLevel === level
                                      ? 'bg-purple-600 text-white shadow-lg'
                                      : 'bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/20 border border-purple-200 dark:border-purple-700'
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="heartRate" className="text-xs text-purple-600 dark:text-purple-400">Heart Rate (bpm)</Label>
                              <Input
                                id="heartRate"
                                type="number"
                                placeholder="Enter heart rate"
                                value={heartRate}
                                onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : "")}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="terrain" className="text-xs text-purple-600 dark:text-purple-400">Terrain</Label>
                              <Input
                                id="terrain"
                                type="text"
                                placeholder="Road, Trail, Hill..."
                                value={terrain}
                                onChange={(e) => setTerrain(e.target.value)}
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="checkbox"
                              id="smartwatch"
                              checked={usesSmartwatch}
                              onChange={(e) => setUsesSmartwatch(e.target.checked)}
                              className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                            />
                            <Label htmlFor="smartwatch" className="text-sm text-purple-600 dark:text-purple-400">
                              Used Smartwatch/Fitness Tracker
                            </Label>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Time Tracking Section */}
                  <div className="space-y-4">
                    {/* Start/End Time Tracking */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">Time Tracking</div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Start Time</div>
                          <div className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                            {startTime ? startTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            }) : '--:--'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">End Time</div>
                          <div className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                            {endTime ? endTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            }) : isTracking ? 'In Progress...' : '--:--'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-center">
                        {!isTracking && !startTime && (
                          <Button 
                            onClick={handleStartTracking}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {isTracking && (
                          <Button 
                            onClick={handleEndTracking}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Square className="w-3 h-3 mr-1" />
                            End
                          </Button>
                        )}
                        {(startTime || endTime) && (
                          <Button 
                            onClick={handleClearTimes}
                            size="sm"
                            variant="outline"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>

                      {(startTime && endTime) && (
                        <div className="mt-3 text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-400">Calculated Duration</div>
                          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                            {getCalculatedDuration()} minutes
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Duration Input */}
                    <div className="flex gap-3">
                      <NumberInput
                        placeholder="Duration (minutes) - overrides time tracking"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="flex-1 h-12 text-lg font-medium text-center border-blue-200 dark:border-blue-700"
                        min="1"
                      />
                      <Button 
                        onClick={handleManualTimeSubmit} 
                        disabled={getFinalDuration() <= 0}
                        className="h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Log Exercise
                      </Button>
                    </div>
                  </div>
                  
                  {/* Enhanced Calorie Display */}
                  {getFinalDuration() > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-center">
                        <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Estimated Calorie Burn</div>
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
                          {Math.round(selectedExercise.caloriesPerMin * getFinalDuration() * (intensity === "low" ? 0.8 : intensity === "high" ? 1.3 : 1.0))} calories
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          {selectedExercise.caloriesPerMin} cal/min × {getFinalDuration()} min × {intensity === "low" ? "0.8" : intensity === "high" ? "1.3" : "1.0"} ({intensity} intensity)
                        </div>
                        <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                          Duration: {manualTime && parseInt(manualTime) > 0 ? 'Manual input' : 'Time tracking'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Timer Card */}
      {showTimer && selectedExercise && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Timer className="w-5 h-5 text-primary mr-2" />
              Exercise Timer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary">
                {formatTime(seconds)}
              </div>
              <div className="text-lg text-muted-foreground">
                {selectedExercise.name}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((seconds / 60) / getTimeNeeded(selectedExercise) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleStartTimer}
                  disabled={isTimerRunning}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
                <Button
                  onClick={handlePauseTimer}
                  disabled={!isTimerRunning}
                  variant="secondary"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={handleStopTimer}
                  disabled={seconds === 0}
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Exercises */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              {selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : `${new Date(selectedDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} Completed Exercises
            </CardTitle>
            {exercises.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearExercisesMutation.mutate()}
                disabled={clearExercisesMutation.isPending}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exercisesLoading ? (
              <div className="text-center py-6 text-muted-foreground">
                <div className="animate-pulse">Loading exercises...</div>
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span className="text-4xl mb-4 block">💪</span>
                <p>No exercises completed yet for {selectedDate === new Date().toISOString().split('T')[0] ? "today" : new Date(selectedDate || new Date()).toLocaleDateString()}.</p>
                <p className="text-sm">Select an exercise above to get started!</p>
              </div>
            ) : (
              exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {exerciseTypes.find(e => e.type === exercise.type)?.icon || "💪"}
                    </span>
                    <div>
                      <div className="font-medium capitalize text-green-800 dark:text-green-200">{exercise.type}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {exercise.duration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-green-700 dark:text-green-300">
                        {Math.round(exercise.caloriesBurned)} cal
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {exercise.completedAt ? new Date(exercise.completedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Just now'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExerciseMutation.mutate(exercise.id)}
                      disabled={removeExerciseMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

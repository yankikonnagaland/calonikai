import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Calendar, TrendingUp, TrendingDown, Target, Flame, ChevronLeft, ChevronRight, Activity, Utensils, Scale, UserCircle, Copy, Download, X, Crown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useRef } from "react";
import type { DailySummary, UserProfile, Exercise } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import SubscriptionModal from "./SubscriptionModal";

interface DashboardProps {
  sessionId: string;
}

export default function Dashboard({ sessionId }: DashboardProps) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Reset selected date to today on component mount
  useEffect(() => {
    setSelectedDate(today);
  }, [today]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Remove meal item mutation
  const removeMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      return apiRequest("DELETE", `/api/meal/${mealId}`);
    },
    onSuccess: () => {
      // Invalidate all meal-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/meal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/user-progress"] });
      
      // Force refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ["/api/daily-summary", sessionId, selectedDate] });
      queryClient.refetchQueries({ queryKey: ["/api/daily-summaries", sessionId] });
      
      toast({
        title: "Meal item removed",
        description: "The food item has been removed from your meal.",
      });
    },
    onError: (error: any) => {
      // Handle 404 errors gracefully (item already removed)
      if (error?.status === 404 || error?.message?.includes("not found")) {
        // Item already removed, just refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/meal"] });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-summaries"] });
        
        // Force refetch to ensure immediate UI update
        queryClient.refetchQueries({ queryKey: ["/api/daily-summary", sessionId, selectedDate] });
        queryClient.refetchQueries({ queryKey: ["/api/daily-summaries", sessionId] });
        
        toast({
          title: "Item already removed",
          description: "The food item has already been removed.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove meal item. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleRemoveMealItem = async (mealId: number, foodName: string) => {
    // Instant removal without confirmation for frictionless UX
    await removeMealFromDailySummary(mealId, foodName);
  };

  const removeMealFromDailySummary = async (mealId: number, foodName: string) => {
    try {
      if (!selectedDaySummary?.mealData) {
        toast({
          title: "Error",
          description: "No meal data found to remove.",
          variant: "destructive",
        });
        return;
      }
      
      const currentMeals = JSON.parse(selectedDaySummary.mealData);
      console.log("🔍 Dashboard Removal Debug:");
      console.log("Current meals in daily summary:", currentMeals);
      console.log("Trying to remove meal ID:", mealId);
      console.log("Food name:", foodName);
      
      // Check if the meal actually exists
      const mealExists = currentMeals.some((meal: any) => meal.id === mealId);
      if (!mealExists) {
        console.log("❌ Meal not found in daily summary");
        toast({
          title: "Item not found",
          description: `${foodName} has already been removed.`,
        });
        return;
      }
      
      const mealToRemove = currentMeals.find((meal: any) => meal.id === mealId);
      console.log("📋 Meal to remove:", mealToRemove);
      
      const updatedMeals = currentMeals.filter((meal: any) => meal.id !== mealId);
      console.log("📋 Updated meals after removal:", updatedMeals);
      
      // Recalculate totals based on remaining meals
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      updatedMeals.forEach((meal: any) => {
        if (meal.food) {
          // Priority 1: Use stored frontend nutrition values (exact from search)
          if (meal.frontendCalories !== undefined && meal.frontendCalories !== null) {
            console.log(`Using stored frontend nutrition for ${meal.food.name}: ${meal.frontendCalories} cal`);
            totalCalories += meal.frontendCalories;
            totalProtein += meal.frontendProtein || 0;
            totalCarbs += meal.frontendCarbs || 0;
            totalFat += meal.frontendFat || 0;
          } else {
            // Priority 2: Fallback to calculated nutrition
            const baseCalories = meal.food.calories || 0;
            const baseProtein = meal.food.protein || 0;
            const baseCarbs = meal.food.carbs || 0;
            const baseFat = meal.food.fat || 0;
            
            // Calculate nutrition based on unit and quantity
            const multiplier = getMultiplierForNutrition(meal.unit, meal.food);
            const quantity = meal.quantity || 1;
            
            totalCalories += (baseCalories * multiplier * quantity);
            totalProtein += (baseProtein * multiplier * quantity);
            totalCarbs += (baseCarbs * multiplier * quantity);
            totalFat += (baseFat * multiplier * quantity);
          }
        }
      });
      
      // Update the daily summary with new data
      const updatedSummary = {
        sessionId: selectedDaySummary.sessionId,
        date: selectedDaySummary.date,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        caloriesBurned: selectedDaySummary.caloriesBurned || 0,
        netCalories: Math.round(totalCalories) - (selectedDaySummary.caloriesBurned || 0),
        mealData: JSON.stringify(updatedMeals)
      };
      
      console.log('🧮 Calculated totals:', { totalCalories, totalProtein, totalCarbs, totalFat });
      console.log('📊 Original daily summary:', selectedDaySummary);
      console.log('📊 Updated daily summary to send:', updatedSummary);
      
      // Save updated summary to backend with replace flag
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedSummary,
          replaceExisting: true  // Flag to indicate this should replace, not add
        })
      });
      
      if (response.ok) {
        // Force refetch of the specific queries to ensure immediate UI update
        await queryClient.refetchQueries({ 
          queryKey: [`/api/daily-summary/${sessionId}/${selectedDate}`] 
        });
        await queryClient.refetchQueries({ 
          queryKey: [`/api/daily-summaries/${sessionId}`] 
        });
        await queryClient.refetchQueries({ 
          queryKey: [`/api/analytics/user-progress`] 
        });
        
        // No toast notification for frictionless removal
      } else {
        const errorText = await response.text();
        console.error('Failed to update daily summary:', errorText);
        throw new Error(`Failed to update daily summary: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing meal:', error);
      toast({
        title: "Error", 
        description: "Failed to remove item from daily summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to calculate nutrition multipliers (same logic as backend calculatePortionNutrition)
  const getMultiplierForNutrition = (unit: string, food: any) => {
    const unitLower = unit.toLowerCase();
    const name = food.name.toLowerCase();
    
    // Check for AI smart portion data first
    if (food.smartPortionGrams && food.smartCalories) {
      // If this is AI-detected smart portion data, use it directly
      return (food.smartPortionGrams / 100); // Convert grams to per-100g multiplier
    }
    
    // Water has 0 calories
    if (name.includes("water")) return 0;
    
    // Enhanced gram weight extraction from unit descriptions (matching backend logic)
    // Extract weight from unit descriptions with comprehensive patterns
    let gramMatch = unitLower.match(/(\d+)g/);
    if (gramMatch) {
      return parseInt(gramMatch[1]) / 100;
    }
    
    // Extract volume from unit descriptions (like "bottle (650ml)")
    const mlMatch = unitLower.match(/(\d+)ml/);
    if (mlMatch) {
      return parseInt(mlMatch[1]) / 100;
    }

    // Enhanced portion calculations - extract gram amounts from unit descriptions (matching backend)
    if (unitLower.includes('450g')) return 4.5; // 450g portions (large meals)
    if (unitLower.includes('320g')) return 3.2; // 320g portions  
    if (unitLower.includes('300g')) return 3.0; // 300g portions
    if (unitLower.includes('250g')) return 2.5; // 250g portions (wraps, etc.)
    if (unitLower.includes('200g')) return 2.0; // Large portion
    if (unitLower.includes('180g')) return 1.8; // Large item
    if (unitLower.includes('150g')) return 1.5; // Medium portion
    if (unitLower.includes('120g')) return 1.2; // Medium fruit/item
    if (unitLower.includes('100g')) return 1.0; // Standard portion
    if (unitLower.includes('80g')) return 0.8; // Small item
    if (unitLower.includes('50g')) return 0.5; // Small portion
    if (unitLower.includes('45g')) return 0.45; // Strip portions
    
    // Beverage volumes with proper multipliers
    if (unitLower.includes('bottle') && unitLower.includes('650ml')) return 6.5;
    if (unitLower.includes('bottle') && unitLower.includes('500ml')) return 5.0;
    if (unitLower.includes('bottle') && unitLower.includes('330ml')) return 3.3;
    if (unitLower.includes('pint') && unitLower.includes('568ml')) return 5.68;
    if (unitLower.includes('glass') && unitLower.includes('250ml')) return 2.5;
    
    // Standard unit mappings
    if (unitLower.includes("piece") || unitLower.includes("pieces")) return 0.15; // 15g per piece
    if (unitLower.includes("cup")) return 2.4; // 240ml/g
    if (unitLower.includes("bowl")) return 2.0; // 200g
    if (unitLower.includes("glass")) return 2.5; // 250ml
    if (unitLower.includes("bottle")) return 6.5; // 650ml for beer bottles (default)
    if (unitLower.includes("slice")) return 0.3; // 30g per slice
    if (unitLower.includes("tablespoon")) return 0.15; // 15g
    if (unitLower.includes("teaspoon")) return 0.05; // 5g
    if (unitLower.includes("handful")) return 0.3; // 30g
    
    return 1.0; // Default fallback (100g)
  };
  
  // Check if user has premium access to health trends
  const isPremium = user?.subscriptionStatus === 'premium';
  const isBasic = user?.subscriptionStatus === 'basic';
  const hasHealthTrendsAccess = isPremium;
  
  // Reset selected date to today when switching months
  useEffect(() => {
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();
    const currentViewMonth = currentMonth.getMonth();
    const currentViewYear = currentMonth.getFullYear();
    
    if (todayMonth === currentViewMonth && todayYear === currentViewYear) {
      setSelectedDate(today);
    } else {
      setSelectedDate("");
    }
  }, [currentMonth, today]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const { data: dailySummaries = [], isLoading } = useQuery<DailySummary[]>({
    queryKey: [`/api/daily-summaries/${sessionId}`],
  });

  const { data: selectedDaySummary } = useQuery<DailySummary>({
    queryKey: [`/api/daily-summary/${sessionId}/${selectedDate}`],
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: [`/api/profile/${sessionId}`],
  });

  // Query exercises specifically for the selected date
  const { data: selectedDateExercises = [], refetch: refetchSelectedDateExercises } = useQuery<Exercise[]>({
    queryKey: [`/api/exercise/${sessionId}/${selectedDate}`],
    enabled: !!sessionId && !!selectedDate,
    staleTime: 0, // Always refetch when invalidated
  });

  // Fetch weight for selected date
  const { data: selectedDateWeight } = useQuery({
    queryKey: [`/api/daily-weight/${sessionId}/${selectedDate}`],
  });

  // Fetch comprehensive user analytics for trendlines
  const { data: userAnalytics } = useQuery({
    queryKey: [`/api/analytics/user-progress`, sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/user-progress?sessionId=${sessionId}&days=14&_t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data (TanStack Query v5)
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Prepare comprehensive chart data with weight, protein, and calories burned trends
  const trendlineData = useMemo(() => {
    if (!userAnalytics?.analytics) return [];
    
    const { nutritionTrends, weightProgress, exerciseHistory } = userAnalytics.analytics;
    const dailyData = nutritionTrends.dailyData || [];
    const weightHistory = weightProgress.weightHistory || [];
    
    // Create maps for easy lookup
    const summaryMap = new Map(dailyData.map((item: any) => [item.date, item]));
    const weightMap = new Map(weightHistory.map((item: any) => [item.date, item.weight]));
    
    // Create exercise calories map from exerciseHistory
    const exerciseCaloriesMap = new Map();
    if (exerciseHistory && Array.isArray(exerciseHistory)) {
      exerciseHistory.forEach((exercise: any) => {
        const exerciseDate = exercise.date || exercise.createdAt?.split('T')[0];
        if (exerciseDate) {
          const currentTotal = exerciseCaloriesMap.get(exerciseDate) || 0;
          exerciseCaloriesMap.set(exerciseDate, currentTotal + (exercise.caloriesBurned || 0));
        }
      });
    }
    
    // Get all unique dates and sort them
    const allDates = new Set([
      ...dailyData.map((item: any) => item.date),
      ...weightHistory.map((item: any) => item.date),
      ...Array.from(exerciseCaloriesMap.keys())
    ]);
    
    const sortedDates = Array.from(allDates).sort().slice(-14); // Last 14 days
    
    // Process weight data with fallback to previous day
    let lastKnownWeight = null;
    
    return sortedDates.map(date => {
      const summary = summaryMap.get(date);
      const currentWeight = weightMap.get(date);
      const exerciseCalories = exerciseCaloriesMap.get(date) || 0;
      
      // Use current weight if available, otherwise fall back to last known weight
      if (currentWeight !== undefined && currentWeight !== null) {
        lastKnownWeight = currentWeight;
      }
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        calories: summary?.totalCalories || 0,
        protein: summary?.totalProtein || 0,
        caloriesBurned: exerciseCalories, // Use exercise data instead of summary data
        weight: currentWeight !== undefined && currentWeight !== null ? currentWeight : lastKnownWeight,
        targetCalories: userProfile?.targetCalories || 2000,
        targetProtein: userProfile?.dailyProteinTarget || 60,
      };
    })
      .filter(item => item.calories > 0 || item.weight || item.protein > 0 || item.caloriesBurned > 0);
  }, [userAnalytics, userProfile]);

  // Legacy chart data for compatibility
  const chartData = trendlineData;

  // Enhanced social sharing component with visual templates
  const ShareComponent = () => {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const shareText = generateShareText();
    const visualTemplate = generateVisualTemplate();
    
    function generateShareText() {
      const userName = userProfile?.firstName || "Fitness Enthusiast";
      const date = new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const caloriesIn = selectedDaySummary?.totalCalories || 0;
      const caloriesOut = selectedDaySummary?.caloriesBurned || 0;
      const netCalories = caloriesIn - caloriesOut;
      const protein = selectedDaySummary?.totalProtein || 0;
      const exerciseCount = selectedDateExercises.length;
      const goalProgress = Math.round((caloriesIn / targetCalories) * 100);
      
      return `🎯 ${userName}'s Daily Progress - ${date}

📊 NUTRITION STATS:
• Calories: ${caloriesIn}/${targetCalories} (${goalProgress}%)
• Burned: ${caloriesOut} cal
• Net: ${netCalories > 0 ? '+' : ''}${netCalories} cal
• Protein: ${protein.toFixed(1)}g

💪 WORKOUT: ${exerciseCount} activities completed

${goalProgress >= 100 ? '🔥 Goal achieved!' : '⚡ On track!'}

Powered by Calonik.ai 🚀

#HealthJourney #CalorieTracking #FitnessGoals #Calonik #HealthTech`;
    }

    function generateVisualTemplate() {
      const userName = userProfile?.firstName || "User";
      const date = new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      const caloriesIn = selectedDaySummary?.totalCalories || 0;
      const caloriesOut = selectedDaySummary?.caloriesBurned || 0;
      const netCalories = caloriesIn - caloriesOut;
      const protein = selectedDaySummary?.totalProtein || 0;
      const goalProgress = Math.round((caloriesIn / targetCalories) * 100);
      
      return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 1080px; 
            height: 1920px; 
            display: flex; 
            flex-direction: column;
            color: white;
            box-sizing: border-box;
            padding: 80px 60px;
        }
        .header { text-align: center; margin-bottom: 80px; }
        .title { font-size: 72px; font-weight: 800; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .subtitle { font-size: 48px; margin: 20px 0 0 0; opacity: 0.9; }
        .date { font-size: 36px; margin: 10px 0 0 0; opacity: 0.8; }
        .stats-container { flex: 1; display: flex; flex-direction: column; gap: 40px; }
        .stat-card { 
            background: rgba(255,255,255,0.15); 
            border-radius: 24px; 
            padding: 50px; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stat-title { font-size: 36px; font-weight: 600; margin-bottom: 20px; opacity: 0.9; }
        .stat-value { font-size: 84px; font-weight: 800; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .progress-bar { 
            width: 100%; 
            height: 24px; 
            background: rgba(255,255,255,0.2); 
            border-radius: 12px; 
            overflow: hidden; 
            margin: 20px 0;
        }
        .progress-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #10b981, #06d6a0); 
            width: ${Math.min(goalProgress, 100)}%; 
            border-radius: 12px;
            transition: width 0.3s ease;
        }
        .footer { 
            text-align: center; 
            margin-top: 60px; 
            font-size: 42px; 
            font-weight: 600;
            opacity: 0.9;
        }
        .brand { 
            background: linear-gradient(90deg, #fbbf24, #f59e0b); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            font-weight: 800;
        }
        .emoji { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title"><span class="emoji">🎯</span> ${userName}'s Progress</h1>
        <p class="subtitle">Daily Nutrition Summary</p>
        <p class="date">${date}</p>
    </div>
    
    <div class="stats-container">
        <div class="stat-card">
            <div class="stat-title"><span class="emoji">🍽️</span> Calories Consumed</div>
            <div class="stat-value">${caloriesIn}</div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div style="font-size: 32px; opacity: 0.8;">${goalProgress}% of ${targetCalories} cal goal</div>
        </div>
        
        <div style="display: flex; gap: 40px;">
            <div class="stat-card" style="flex: 1;">
                <div class="stat-title"><span class="emoji">🔥</span> Burned</div>
                <div class="stat-value" style="font-size: 64px;">${caloriesOut}</div>
            </div>
            <div class="stat-card" style="flex: 1;">
                <div class="stat-title"><span class="emoji">💪</span> Protein</div>
                <div class="stat-value" style="font-size: 64px;">${protein.toFixed(0)}g</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-title"><span class="emoji">⚡</span> Net Calories</div>
            <div class="stat-value" style="color: ${netCalories > targetCalories ? '#f87171' : '#10b981'};">
                ${netCalories > 0 ? '+' : ''}${netCalories}
            </div>
        </div>
    </div>
    
    <div class="footer">
        Powered by <span class="brand">Calonik.ai</span> <span class="emoji">🚀</span>
    </div>
</body>
</html>`;
    }
    
    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard!",
          description: "Share text is ready to paste anywhere.",
        });
        setShareDialogOpen(false);
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please select and copy the text manually.",
          variant: "destructive",
        });
      }
    };
    
    const shareOnSocial = (platform: string) => {
      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(window.location.href);
      
      let shareUrl = '';
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodedText}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`;
          break;
        case 'instagram':
          // Instagram Stories sharing via URL scheme (mobile only)
          if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            shareUrl = `instagram-stories://share`;
            // For Instagram, we'll download the visual template as image
            downloadVisualTemplate('instagram');
            toast({
              title: "Instagram Story Ready!",
              description: "Image downloaded. Open Instagram and upload to your story!",
            });
            setShareDialogOpen(false);
            return;
          } else {
            toast({
              title: "Instagram Sharing",
              description: "Download the visual template and share it on Instagram from your mobile device!",
            });
            downloadVisualTemplate('instagram');
            setShareDialogOpen(false);
            return;
          }
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setShareDialogOpen(false);
      }
    };

    const downloadVisualTemplate = (format: 'jpeg' | 'instagram' = 'jpeg') => {
      if (format === 'jpeg') {
        // Create Apple-inspired JPEG image
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Clean white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Subtle border
          ctx.strokeStyle = '#f0f0f0';
          ctx.lineWidth = 2;
          ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
          
          // App name
          ctx.fillStyle = '#1d1d1f';
          ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Calonik.ai', 80, 120);
          
          // Date
          ctx.fillStyle = '#86868b';
          ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }), 80, 160);
          
          // Main metrics
          const caloriesIn = Math.round(selectedDaySummary?.totalCalories || 0);
          const caloriesOut = Math.round(selectedDaySummary?.caloriesBurned || 0);
          
          // Calories In
          ctx.fillStyle = '#007AFF';
          ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(caloriesIn.toString(), 80, 310);
          ctx.fillStyle = '#86868b';
          ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Calories In', 80, 340);
          
          // Calories Out
          ctx.fillStyle = '#FF3B30';
          ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(caloriesOut.toString(), 540, 310);
          ctx.fillStyle = '#86868b';
          ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Calories Out', 540, 340);
          
          // Exercise
          ctx.fillStyle = '#1d1d1f';
          ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Today\'s Exercise', 80, 420);
          const exerciseText = selectedDateExercises.length > 0 
            ? selectedDateExercises.map((ex: any) => ex.name).join(', ') 
            : 'No exercise recorded';
          ctx.fillStyle = '#86868b';
          ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(exerciseText.length > 60 ? exerciseText.substring(0, 60) + '...' : exerciseText, 80, 455);
          
          // Nutrition
          ctx.fillStyle = '#1d1d1f';
          ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('Nutrition', 80, 520);
          
          ctx.fillStyle = '#86868b';
          ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(`Protein: ${Math.round(selectedDaySummary?.totalProtein || 0)}g`, 80, 555);
          ctx.fillText(`Carbs: ${Math.round(selectedDaySummary?.totalCarbs || 0)}g`, 360, 555);
          ctx.fillText(`Fat: ${Math.round(selectedDaySummary?.totalFat || 0)}g`, 640, 555);
          
          // Goal progress
          if (userProfile) {
            const goalProgress = Math.round(((selectedDaySummary?.totalCalories || 0) / userProfile.targetCalories) * 100);
            
            ctx.fillStyle = '#1d1d1f';
            ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText('Calorie Goal Progress', 80, 640);
            
            ctx.fillStyle = goalProgress > 100 ? '#FF3B30' : '#34C759';
            ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(`${goalProgress}%`, 80, 700);
            
            // Progress bar
            const barWidth = 800;
            const barHeight = 8;
            const barX = 80;
            const barY = 725;
            
            ctx.fillStyle = '#f2f2f7';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const progressWidth = Math.min((barWidth * goalProgress) / 100, barWidth);
            ctx.fillStyle = goalProgress > 100 ? '#FF3B30' : '#34C759';
            ctx.fillRect(barX, barY, progressWidth, barHeight);
            
            ctx.fillStyle = '#86868b';
            ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(`Target: ${userProfile.targetCalories} calories`, 80, 755);
          }
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `calonik-progress-${selectedDate}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, 'image/jpeg', 0.95);
        }
      } else if (format === 'instagram') {
        // Create a canvas to generate Instagram Story format (1080x1920)
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Create gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text content
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          
          // Title
          ctx.font = 'bold 72px Arial';
          ctx.fillText(`🎯 ${userProfile?.firstName || "User"}'s Progress`, canvas.width/2, 200);
          
          // Date
          ctx.font = '48px Arial';
          ctx.fillText(new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }), canvas.width/2, 280);
          
          // Stats
          const caloriesIn = selectedDaySummary?.totalCalories || 0;
          const caloriesOut = selectedDaySummary?.caloriesBurned || 0;
          const protein = selectedDaySummary?.totalProtein || 0;
          const goalProgress = Math.round((caloriesIn / targetCalories) * 100);
          
          ctx.font = 'bold 64px Arial';
          ctx.fillText(`🍽️ ${caloriesIn} calories`, canvas.width/2, 500);
          
          ctx.font = '42px Arial';
          ctx.fillText(`${goalProgress}% of ${targetCalories} cal goal`, canvas.width/2, 580);
          
          ctx.font = 'bold 56px Arial';
          ctx.fillText(`🔥 ${caloriesOut} burned`, canvas.width/2, 720);
          ctx.fillText(`💪 ${protein.toFixed(0)}g protein`, canvas.width/2, 820);
          
          // Net calories
          const netCalories = caloriesIn - caloriesOut;
          ctx.fillStyle = netCalories > targetCalories ? '#f87171' : '#10b981';
          ctx.font = 'bold 72px Arial';
          ctx.fillText(`⚡ ${netCalories > 0 ? '+' : ''}${netCalories} net`, canvas.width/2, 980);
          
          // Footer
          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px Arial';
          ctx.fillText('Powered by Calonik.ai 🚀', canvas.width/2, 1700);
          
          // Download as image
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `calonik-story-${selectedDate}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
      }
      
      if (format !== 'jpeg') {
        toast({
          title: "Visual Template Downloaded!",
          description: format === 'html' ? "HTML template ready to share" : "Instagram story image ready to upload",
        });
        setShareDialogOpen(false);
      } else {
        toast({
          title: "JPEG Downloaded!",
          description: "High-quality image ready to share on social media",
        });
        setShareDialogOpen(false);
      }
    };
    
    const [showHtmlPreview, setShowHtmlPreview] = useState(false);

    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <h4 className="font-semibold mb-4">Share Your Progress</h4>
          
          <div className="mb-4 border rounded-lg overflow-hidden bg-white">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-medium">
              Progress Summary
            </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Calonik.ai</h2>
                  <p className="text-gray-600">{new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{Math.round(selectedDaySummary?.totalCalories || 0)}</div>
                    <div className="text-sm text-gray-600">Calories In</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{Math.round(selectedDaySummary?.caloriesBurned || 0)}</div>
                    <div className="text-sm text-gray-600">Calories Out</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Today's Exercise</h3>
                  <p className="text-gray-600">{selectedDateExercises.length > 0 ? selectedDateExercises.map((ex: any) => ex.name).join(', ') : 'No exercise recorded'}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Nutrition</h3>
                  <div className="flex justify-between">
                    <span>Protein: {Math.round(selectedDaySummary?.totalProtein || 0)}g</span>
                    <span>Carbs: {Math.round(selectedDaySummary?.totalCarbs || 0)}g</span>
                    <span>Fat: {Math.round(selectedDaySummary?.totalFat || 0)}g</span>
                  </div>
                </div>
                
                {userProfile && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Calorie Goal Progress</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(((selectedDaySummary?.totalCalories || 0) / userProfile.targetCalories) * 100)}%
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(((selectedDaySummary?.totalCalories || 0) / userProfile.targetCalories) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Target: {userProfile.targetCalories} calories</p>
                  </div>
                )}
              </div>
            </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={() => downloadVisualTemplate('jpeg')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JPEG
            </Button>
            <Button 
              onClick={() => copyToClipboard(shareText)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Text
            </Button>
            <Button 
              onClick={() => shareOnSocial('whatsapp')}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
            >
              Share WhatsApp
            </Button>
          </div>
        </div>
        
        <textarea 
          readOnly 
          value={shareText}
          className="w-full h-32 p-3 text-sm border rounded-md resize-none"
        />
        
        <Button 
          onClick={() => copyToClipboard(shareText)}
          className="w-full flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Text to Clipboard
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => shareOnSocial('twitter')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
          >
            Share on Twitter
          </Button>
          <Button 
            onClick={() => shareOnSocial('facebook')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            Share on Facebook
          </Button>
          <Button 
            onClick={() => shareOnSocial('whatsapp')}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
          >
            Share on WhatsApp
          </Button>
          <Button 
            onClick={() => shareOnSocial('instagram')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Instagram Story
          </Button>
        </div>
      </div>
    );
  };

  // AI-powered motivational message
  const { data: motivationalMessage } = useQuery<{
    type: 'success' | 'warning' | 'info' | 'default';
    message: string;
    tip?: string;
  }>({
    queryKey: [`/api/motivational-message/${sessionId}`],
    enabled: !!userProfile,
  });

  // Get usage stats to check subscription status
  const { data: usageStats } = useQuery<{
    photos: number;
    meals: number;
    searches: number;
    limits: { photos: number; meals: number };
    remaining: { photos: number; meals: number };
    isPremium: boolean;
    isBasic: boolean;
    subscriptionStatus: string;
  }>({
    queryKey: ['/api/usage-stats'],
    enabled: !!sessionId,
  });

  // Calculate selected date's calories and exercise data
  const selectedSummary = selectedDaySummary || dailySummaries.find(s => s.date === selectedDate);
  const todaySummary = dailySummaries.find(s => s.date === today);
  
  // Get meal items from selected date's daily summary
  const selectedMealItems = selectedSummary?.mealData ? JSON.parse(selectedSummary.mealData) : [];
  const todayMealItems = todaySummary?.mealData ? JSON.parse(todaySummary.mealData) : [];

  const getCalorieStatus = (summary: DailySummary | undefined) => {
    if (!summary || !userProfile) return null;
    
    const dailyCalories = summary.totalCalories;
    const goalCalories = userProfile.targetCalories || 2000;
    const weightGoal = userProfile.weightGoal || 'maintain';
    
    // Calculate achievement based on weight goal
    let achieved = false;
    
    if (weightGoal === 'lose') {
      // For weight loss, achieved if calories are under target (allowing 10% tolerance)
      achieved = dailyCalories <= goalCalories * 1.1;
    } else if (weightGoal === 'gain') {
      // For weight gain, achieved if calories are at or above target (allowing 10% below tolerance)
      achieved = dailyCalories >= goalCalories * 0.9;
    } else {
      // For maintain, achieved if within 15% of target
      achieved = Math.abs(dailyCalories - goalCalories) <= goalCalories * 0.15;
    }
    
    return { 
      color: achieved ? 'bg-green-500' : 'bg-red-500', 
      status: achieved ? 'achieved' : 'missed',
      achieved 
    };
  };

  // Generate calendar days for current month
  const generateSimpleCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = dailySummaries.find(s => s.date === dateStr);
      days.push({ day, dateStr, summary });
    }
    
    return days;
  };
  
  // Handle date selection from React Native Calendar
  const handleDateSelect = (day: any) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    // Invalidate queries to refresh data for the selected date
    queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${dateStr}`] });
  };



  // Helper function to calculate calories burned from exercises for the selected date only
  const getCaloriesOutForDate = (dateStr: string) => {
    // Only calculate for the selected date using the date-specific exercises
    if (dateStr === selectedDate) {
      return selectedDateExercises.reduce((total, ex) => {
        return total + (ex.caloriesBurned || 0);
      }, 0);
    }
    
    // For other dates, we don't have the data, so return 0
    // This ensures exercises only show for their specific dates
    return 0;
  };

  const selectedCaloriesIn = Math.round((selectedSummary?.totalCalories || 0) * 100) / 100;
  // Always calculate calories out from exercises for the selected date
  const selectedCaloriesOut = Math.round(getCaloriesOutForDate(selectedDate) * 100) / 100;
  const selectedNetCalories = Math.round((selectedCaloriesIn - selectedCaloriesOut) * 100) / 100;
  
  const todayCaloriesIn = Math.round((todaySummary?.totalCalories || 0) * 100) / 100;
  const todayCaloriesOut = Math.round(getCaloriesOutForDate(today) * 100) / 100;
  const netCalories = Math.round((todayCaloriesIn - todayCaloriesOut) * 100) / 100;
  const targetCalories = userProfile?.targetCalories || 2000;

  // Protein calculations
  const selectedProteinIn = Math.round((selectedSummary?.totalProtein || 0) * 10) / 10;
  const todayProteinIn = Math.round((todaySummary?.totalProtein || 0) * 10) / 10;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Loading Dashboard...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Calendar Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Health Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedDate === today 
                ? "Today's progress and insights"
                : `Progress for ${new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`
              }
            </p>
          </div>
          
          {/* Calendar Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
              >
                <Calendar className="w-4 h-4" />
                {selectedDate === today 
                  ? "Today" 
                  : new Date(selectedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                {/* Month navigation */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentMonth(newDate);
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="font-medium text-sm">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentMonth(newDate);
                    }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {generateSimpleCalendarDays().map((dayData, index) => (
                    <div key={index} className="aspect-square">
                      {dayData ? (
                        <button
                          onClick={() => handleDateSelect({ dateString: dayData.dateStr })}
                          className={`w-full h-full rounded text-xs font-medium transition-all relative ${
                            selectedDate === dayData.dateStr
                              ? 'bg-purple-500 text-white'
                              : dayData.dateStr === today
                              ? 'bg-blue-500 text-white'
                              : dayData.summary
                              ? getCalorieStatus(dayData.summary)?.achieved 
                                ? 'bg-green-100 hover:bg-green-200 text-green-800'
                                : 'bg-red-100 hover:bg-red-200 text-red-800'
                              : 'hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          <span className="relative z-10">{dayData.day}</span>
                        </button>
                      ) : (
                        <div className="w-full h-full"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 text-xs border-t pt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded"></div>
                    <span>Goal Met</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded"></div>
                    <span>Missed</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 gap-6">
      {/* Main Content - Daily Summary */}
      <div className="lg:col-span-3 space-y-6">
        {/* Calorie Goal Progress - Moved to Top */}
        {userProfile && usageStats?.isPremium ? (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Daily Calorie Goal Progress
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Target: {targetCalories} calories | Current: {Math.round((selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) * 10) / 10} calories
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Small Doughnut Chart */}
                <div className="w-24 h-24 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#9333ea" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={[
                          { 
                            name: 'Progress', 
                            value: Math.min(((selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) / targetCalories) * 100, 100),
                            color: 'url(#progressGradient)'
                          },
                          { 
                            name: 'Remaining', 
                            value: Math.max(100 - ((selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) / targetCalories) * 100, 0),
                            color: '#e5e7eb'
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={40}
                        startAngle={90}
                        endAngle={450}
                        dataKey="value"
                      >
                        <Cell fill="url(#progressGradient)" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {Math.round(((selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) / targetCalories) * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Progress details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Current</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">{Math.round((selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) * 10) / 10} cal</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Target</span>
                    <span>{targetCalories} cal</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Remaining</span>
                    <span className={targetCalories - (selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) < 0 ? 'text-red-500' : 'text-green-600'}>
                      {targetCalories - (selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) < 0 
                        ? `+${Math.round(Math.abs(targetCalories - (selectedDate === today ? todayCaloriesIn : selectedCaloriesIn)) * 10) / 10} cal over`
                        : `${Math.round((targetCalories - (selectedDate === today ? todayCaloriesIn : selectedCaloriesIn)) * 10) / 10} cal left`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {(selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) > targetCalories && (
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800 mt-4">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    You've exceeded your daily calorie goal by {Math.round(((selectedDate === today ? todayCaloriesIn : selectedCaloriesIn) - targetCalories) * 10) / 10} calories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : userProfile && !usageStats?.isPremium ? (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 relative">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-800 dark:text-blue-200">Daily Calorie Goal Progress</CardTitle>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Track your calorie intake vs targets with visual progress</p>
                </div>
                <div className="ml-auto">
                
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-64 blur-md">
                <div className="flex items-center justify-center h-full">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 to-purple-800"></div>
                </div>
              </div>
              
              {/* Premium Access Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/80 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/80 flex items-center justify-center rounded-lg">
                <div className="text-center p-6 bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Daily Calorie Goal Progress
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Unlock beautiful doughnut charts to visualize your daily calorie intake vs your personal targets
                    </p>
                    {usageStats?.isBasic ? (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                        Upgrade from Basic (🔰) to Premium (👑) plan
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Premium feature - Subscribe to unlock
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6 py-2"
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Protein Goal Progress */}
        {userProfile && (userProfile.targetProtein || userProfile.dailyProteinTarget) && usageStats?.isPremium ? (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                Daily Protein Goal Progress
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Target: {userProfile.targetProtein || userProfile.dailyProteinTarget}g protein | Current: {Math.round((selectedDate === today ? todayProteinIn : selectedProteinIn) * 10) / 10}g protein
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Small Protein Doughnut Chart */}
                <div className="w-24 h-24 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={[
                          { 
                            name: 'Progress', 
                            value: Math.min(((selectedDate === today ? todayProteinIn : selectedProteinIn) / (userProfile.targetProtein || userProfile.dailyProteinTarget)) * 100, 100),
                            color: 'url(#proteinGradient)'
                          },
                          { 
                            name: 'Remaining', 
                            value: Math.max(100 - ((selectedDate === today ? todayProteinIn : selectedProteinIn) / (userProfile.targetProtein || userProfile.dailyProteinTarget)) * 100, 0),
                            color: '#e5e7eb'
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={40}
                        startAngle={90}
                        endAngle={450}
                        dataKey="value"
                      >
                        <Cell fill="url(#proteinGradient)" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      {Math.round(((selectedDate === today ? todayProteinIn : selectedProteinIn) / (userProfile.targetProtein || userProfile.dailyProteinTarget)) * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Protein Progress details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Current</span>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent font-semibold">{Math.round((selectedDate === today ? todayProteinIn : selectedProteinIn) * 10) / 10}g</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Target</span>
                    <span>{userProfile.targetProtein || userProfile.dailyProteinTarget}g</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Remaining</span>
                    <span className={(userProfile.targetProtein || userProfile.dailyProteinTarget) - (selectedDate === today ? todayProteinIn : selectedProteinIn) < 0 ? 'text-red-500' : 'text-green-600'}>
                      {(userProfile.targetProtein || userProfile.dailyProteinTarget) - (selectedDate === today ? todayProteinIn : selectedProteinIn) < 0 
                        ? `+${Math.round(Math.abs((userProfile.targetProtein || userProfile.dailyProteinTarget) - (selectedDate === today ? todayProteinIn : selectedProteinIn)) * 10) / 10}g over`
                        : `${Math.round(((userProfile.targetProtein || userProfile.dailyProteinTarget) - (selectedDate === today ? todayProteinIn : selectedProteinIn)) * 10) / 10}g left`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {(selectedDate === today ? todayProteinIn : selectedProteinIn) > (userProfile.targetProtein || userProfile.dailyProteinTarget) && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mt-4">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Great! You've exceeded your daily protein goal by {Math.round(((selectedDate === today ? todayProteinIn : selectedProteinIn) - (userProfile.targetProtein || userProfile.dailyProteinTarget)) * 10) / 10}g
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : userProfile && (userProfile.targetProtein || userProfile.dailyProteinTarget) && !usageStats?.isPremium ? (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 relative">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-800 dark:text-green-200">Daily Protein Goal Progress</CardTitle>
                  <p className="text-sm text-green-600 dark:text-green-400">Track your protein intake vs targets with visual progress</p>
                </div>
                <div className="ml-auto">
                 
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-64 blur-md">
                <div className="flex items-center justify-center h-full">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 to-emerald-800"></div>
                </div>
              </div>
              
              {/* Premium Access Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/80 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/80 flex items-center justify-center rounded-lg">
                <div className="text-center p-6 bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Daily Protein Goal Progress
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Unlock beautiful doughnut charts to visualize your daily protein intake vs your personal targets
                    </p>
                    {usageStats?.isBasic ? (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                        Upgrade from Basic (🔰) to Premium (👑) plan
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Premium feature - Subscribe to unlock
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-6 py-2"
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Today's Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl">
                  <Target className="w-6 h-6 mr-3 text-primary" />
                  {selectedDate === today ? "Today's Nutrition Summary" : "Nutrition Summary"}
                </CardTitle>
                <p className="text-muted-foreground">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Selected Date Weight Display */}
              {(selectedDateWeight || userProfile?.weight) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <Scale className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedDate === today ? "Today's Weight" : "Weight"}
                      </p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        {selectedDateWeight?.weight || userProfile?.weight} kg
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calories In vs Out + Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <Utensils className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Calories In</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{selectedCaloriesIn}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Calories Out</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{selectedCaloriesOut}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                selectedNetCalories > targetCalories 
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    selectedNetCalories > targetCalories 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Flame className={`w-5 h-5 ${
                      selectedNetCalories > targetCalories ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      selectedNetCalories > targetCalories 
                        ? 'text-red-700 dark:text-red-300' 
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>Net Calories</p>
                    <p className={`text-2xl font-bold ${
                      selectedNetCalories > targetCalories 
                        ? 'text-red-800 dark:text-red-200' 
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>{selectedNetCalories}</p>
                  </div>
                </div>
              </div>

              

              {/* Protein Tracking Card - Show only for Build Muscle goal */}
              {userProfile?.weightGoal === 'muscle' && userProfile?.targetProtein && (
                <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-full">
                      <Target className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                        Daily Protein
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">
                          {selectedDaySummary?.totalProtein?.toFixed(1) || '0.0'}g
                        </p>
                        <span className="text-sm text-cyan-600 dark:text-cyan-400">
                          / {userProfile.targetProtein}g
                        </span>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={Math.min(100, ((selectedDaySummary?.totalProtein || 0) / userProfile.targetProtein) * 100)} 
                          className="h-2"
                        />
                      </div>
                      <p className="text-xs text-cyan-500 dark:text-cyan-400 mt-1">
                        {Math.round(((selectedDaySummary?.totalProtein || 0) / userProfile.targetProtein) * 100)}% of muscle building target
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            


            

            {/* Profile Setup Prompt for users without saved profile */}
            {!userProfile?.bmr && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 p-3 rounded-full">
                    <UserCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200">Complete Your Profile</h3>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Set up your profile to get personalized nutrition targets and track your progress
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={() => window.dispatchEvent(new CustomEvent('switchToProfile'))}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Set Up Profile Now
                  </Button>
                </div>
              </div>
            )}

            {/* AI-Powered Motivational Message */}
            {motivationalMessage && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Flame className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-blue-800 dark:text-blue-200">
                      Daily Motivation
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Stay motivated with your nutrition journey!
                    </p>
                  </div>
                </div>
              </div>
            )}



            {/* Combined Comprehensive Trendlines Chart */}
            {trendlineData.length > 0 && (
              <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-900/30 p-2 rounded-full">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-800 dark:text-slate-200">Complete Health Trends</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">See how your calorie intake and exercise changes your weight overtime</p>
                    </div>
                    {!hasHealthTrendsAccess && (
                      <div className="ml-auto">
                       
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className={!hasHealthTrendsAccess ? "relative" : ""}>
                  <div className={`h-80 sm:h-96 ${!hasHealthTrendsAccess ? "blur-md" : ""}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendlineData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9 }}
                          className="text-xs"
                        />
                        
                        {/* Left Y-Axis for Calories */}
                        <YAxis 
                          yAxisId="calories"
                          orientation="left"
                          tick={{ fontSize: 8 }}
                          label={({ viewBox }) => {
                            const { x, y, width, height } = viewBox || {};
                            const cx = x - 15;
                            const cy = (y || 0) + (height || 0) * 0.8;
                            return (
                              <text 
                                x={cx} 
                                y={cy} 
                                fill="#666" 
                                textAnchor="middle" 
                                dominantBaseline="central"
                                transform={`rotate(-90, ${cx}, ${cy})`}
                                style={{ fontSize: '10px' }}
                              >
                                Cal
                              </text>
                            );
                          }}
                          domain={[0, 'dataMax + 200']}
                          width={25}
                        />
                        
                        {/* Right Y-Axis for Weight */}
                        <YAxis 
                          yAxisId="secondary"
                          orientation="right"
                          tick={{ fontSize: 8 }}
                          label={{ value: 'kg', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '10px' } }}
                          domain={[0, 'dataMax + 10']}
                          width={25}
                        />
                        
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '11px',
                            padding: '8px'
                          }}
                          formatter={(value: any, name: string) => {
                            switch(name) {
                              case 'calories': return [`${value} cal`, 'Cal In'];
                              case 'caloriesBurned': return [`${value} cal`, 'Cal Out'];
                              case 'protein': return [`${value}g`, 'Protein'];
                              case 'weight': return [`${value} kg`, 'Weight'];
                              case 'targetCalories': return [`${value} cal`, 'Target'];
                              case 'targetProtein': return [`${value}g`, 'Protein Target'];
                              default: return [value, name];
                            }
                          }}
                        />
                        
                        <Legend 
                          wrapperStyle={{ paddingTop: '15px', fontSize: '10px' }}
                          iconType="line"
                          formatter={(value: string) => {
                            switch(value) {
                              case 'Calories Consumed': return 'Cal In';
                              case 'Calories Burned': return 'Cal Out';
                              default: return value;
                            }
                          }}
                        />
                        
                        {/* Calories Consumed - Green */}
                        <Line 
                          yAxisId="calories"
                          type="monotone" 
                          dataKey="calories" 
                          stroke="#059669" 
                          strokeWidth={2.5}
                          dot={{ fill: '#059669', strokeWidth: 1, r: 3 }}
                          activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2 }}
                          name="Cal In"
                          connectNulls={false}
                        />
                        

                        
                        {/* Calories Burned - Orange */}
                        <Line 
                          yAxisId="calories"
                          type="monotone" 
                          dataKey="caloriesBurned" 
                          stroke="#ea580c" 
                          strokeWidth={2.5}
                          dot={{ fill: '#ea580c', strokeWidth: 1, r: 3 }}
                          activeDot={{ r: 5, stroke: '#ea580c', strokeWidth: 2 }}
                          name="Cal Out"
                          connectNulls={false}
                        />
                        
                        {/* Weight Progress - Purple */}
                        <Line 
                          yAxisId="secondary"
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#9333ea" 
                          strokeWidth={2.5}
                          dot={{ fill: '#9333ea', strokeWidth: 1, r: 3 }}
                          activeDot={{ r: 5, stroke: '#9333ea', strokeWidth: 2 }}
                          name="Weight"
                          connectNulls={false}
                        />
                        

                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Trend Summary Cards */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="font-medium text-green-800 dark:text-green-200">Calories In</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Avg: {userAnalytics?.analytics?.nutritionTrends?.avgDailyCalories || 0} cal/day
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                        <span className="font-medium text-orange-800 dark:text-orange-200">Calories Out</span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Avg: {(() => {
                          const exerciseHistory = userAnalytics?.analytics?.exerciseHistory || [];
                          if (exerciseHistory.length === 0) return 0;
                          
                          // Group exercises by date and sum calories
                          const dailyExerciseCalories = new Map();
                          exerciseHistory.forEach((exercise: any) => {
                            const exerciseDate = exercise.date || exercise.createdAt?.split('T')[0];
                            if (exerciseDate) {
                              const currentTotal = dailyExerciseCalories.get(exerciseDate) || 0;
                              dailyExerciseCalories.set(exerciseDate, currentTotal + (exercise.caloriesBurned || 0));
                            }
                          });
                          
                          // Calculate average across all days with exercise data
                          const totalCaloriesBurned = Array.from(dailyExerciseCalories.values()).reduce((sum, cal) => sum + cal, 0);
                          const daysWithExercise = dailyExerciseCalories.size;
                          
                          return daysWithExercise > 0 ? Math.round(totalCaloriesBurned / daysWithExercise) : 0;
                        })()} cal/day
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="font-medium text-purple-800 dark:text-purple-200">Weight</span>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {userAnalytics?.analytics?.weightProgress?.trend === 'decreasing' ? '↓ Losing' :
                         userAnalytics?.analytics?.weightProgress?.trend === 'increasing' ? '↑ Gaining' : 
                         '→ Stable'}
                        {userAnalytics?.analytics?.weightProgress?.totalWeightChange !== 0 && 
                          ` ${userAnalytics?.analytics?.weightProgress?.totalWeightChange}kg`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Premium Access Overlay for Non-Premium Users */}
                  {!hasHealthTrendsAccess && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/80 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/80 flex items-center justify-center rounded-lg">
                      <div className="text-center p-6 bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Complete Health Trends
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Unlock comprehensive health analytics with detailed calorie, weight, and exercise trend visualization
                          </p>
                          {isBasic ? (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                              Upgrade from Basic (🔰) to Premium (👑) plan
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                              Premium feature - Subscribe to unlock
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => setShowSubscriptionModal(true)}
                          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium px-6 py-2"
                        >
                          Upgrade to Premium
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


          </CardContent>
        </Card>

        {/* Selected Date Activities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selected Date Food Items */}
          {(() => {
            // Use daily summary meal data for submitted/saved meals (what should appear in Dashboard)
            // Live meal data is for current meal tracker, daily summary is for completed meals
            const selectedDateMealItems = selectedDaySummary?.mealData 
              ? JSON.parse(selectedDaySummary.mealData) 
              : [];
            
            return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-green-600" />
                  {selectedDate === today ? "Today's Food Items" : `${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Food Items`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateMealItems.length > 0 ? (
                    selectedDateMealItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {item.food?.name || 'Unknown Food'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <span className="text-blue-600 font-medium">
                              {(() => {
                                // Priority 1: Use stored frontend nutrition values (exact from search)
                                if (item.frontendCalories !== undefined && item.frontendCalories !== null) {
                                  return Math.round(item.frontendCalories);
                                }
                                
                                // Priority 2: Fallback to basic calculation
                                const multiplier = getMultiplierForNutrition(item.unit, item.food);
                                return Math.round((item.food?.calories || 0) * (item.quantity || 1) * multiplier);
                              })()}
                            </span>
                            <p className="text-xs text-gray-500">cal</p>
                          </div>
                          <div className="text-center">
                            <span className="text-green-600 font-medium">
                              {(() => {
                                // Priority 1: Use stored frontend nutrition values (exact from search)
                                if (item.frontendProtein !== undefined && item.frontendProtein !== null) {
                                  return Math.round(item.frontendProtein * 10) / 10; // 1 decimal place
                                }
                                
                                // Priority 2: Fallback to basic calculation
                                const multiplier = getMultiplierForNutrition(item.unit, item.food);
                                return Math.round((item.food?.protein || 0) * (item.quantity || 1) * multiplier * 10) / 10; // 1 decimal place
                              })()}g
                          </span>
                          <p className="text-xs text-gray-500">protein</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMealItem(item.id, item.food?.name || 'Unknown Food')}
                          disabled={removeMealMutation.isPending}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
                        >
                          {removeMealMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No meals logged for {selectedDate === today ? 'today' : 'this date'}</p>
                      <p className="text-sm mt-1">Start tracking by adding foods in the Tracker tab</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })()}

          {/* Selected Date Completed Exercises */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                {selectedDate === today ? "Today's Completed Exercises" : `${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Exercises`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDateExercises.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <span className="text-3xl mb-2 block">💪</span>
                    <p className="text-sm">No exercises completed yet for {selectedDate === today ? "today" : selectedDate}.</p>
                    <p className="text-xs">Visit the Exercise tab to start tracking!</p>
                  </div>
                ) : (
                  selectedDateExercises.map((exercise) => (
                    <div key={exercise.id} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {exercise.exerciseName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {exercise.duration} minutes
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="text-center">
                          <span className="text-orange-600 font-bold">
                            {Math.round(exercise.caloriesBurned)} cal
                          </span>
                          <p className="text-xs text-gray-500">burned</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Details */}
        {selectedDaySummary && (
          <Card>
            <CardHeader>
              <CardTitle>
                Daily Summary - {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedDaySummary.totalCalories}</p>
                  <p className="text-sm text-muted-foreground">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{Number(selectedDaySummary.totalProtein).toFixed(2).replace(/\.?0+$/, '')}g</p>
                  <p className="text-sm text-muted-foreground">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{Number(selectedDaySummary.totalCarbs).toFixed(2).replace(/\.?0+$/, '')}g</p>
                  <p className="text-sm text-muted-foreground">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{Number(selectedDaySummary.totalFat).toFixed(2).replace(/\.?0+$/, '')}g</p>
                  <p className="text-sm text-muted-foreground">Fat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Days Tracked</span>
                <Badge variant="outline" className="text-xs">
                  {dailySummaries.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Avg Daily</span>
                <span className="text-xs font-medium">
                  {dailySummaries.length > 0 
                    ? Math.round(dailySummaries.reduce((sum, s) => sum + s.totalCalories, 0) / dailySummaries.length)
                    : 0
                  } cal
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-2">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-300">Days tracked:</span>
                    <span className="font-medium">{dailySummaries.filter(s => {
                      const summaryDate = new Date(s.date);
                      return summaryDate.getMonth() === currentMonth.getMonth() && 
                             summaryDate.getFullYear() === currentMonth.getFullYear();
                    }).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-300">Total calories:</span>
                    <span className="font-medium">{dailySummaries.filter(s => {
                      const summaryDate = new Date(s.date);
                      return summaryDate.getMonth() === currentMonth.getMonth() && 
                             summaryDate.getFullYear() === currentMonth.getFullYear();
                    }).reduce((sum, s) => sum + s.totalCalories, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600 dark:text-orange-300">Total burned:</span>
                    <span className="font-medium">{userAnalytics?.analytics?.exerciseMetrics?.totalCaloriesBurned?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600 dark:text-purple-300">Monthly avg:</span>
                    <span className="font-medium">
                      {(() => {
                        const monthData = dailySummaries.filter(s => {
                          const summaryDate = new Date(s.date);
                          return summaryDate.getMonth() === currentMonth.getMonth() && 
                                 summaryDate.getFullYear() === currentMonth.getFullYear();
                        });
                        return monthData.length > 0 ? Math.round(monthData.reduce((sum, s) => sum + s.totalCalories, 0) / monthData.length) : 0;
                      })()} cal/day
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      )}
    </div>
  );
}
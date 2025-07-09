import { useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import FoodSearch from "@/components/FoodSearch";
import MealSummary from "@/components/MealSummary";
import UserProfile from "@/components/UserProfile";
import ExerciseTracker from "@/components/ExerciseTracker";
import Dashboard from "@/components/Dashboard";
import FoodCamera from "@/components/FoodCamera";
import TrackerNutritionSummary from "@/components/TrackerNutritionSummary";
import WeightUpdateModal from "@/components/WeightUpdateModal";
import HourlyNudgeNotification from "@/components/HourlyNudgeNotification";
import { getSessionId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Utensils } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

type TabType = "tracker" | "profile" | "exercise" | "dashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("tracker");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingMealItem, setEditingMealItem] = useState<any>(null);
  const { user } = useAuth();
  const sessionId = user?.id || getSessionId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle tab change with scroll to top
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for profile setup navigation event
  useEffect(() => {
    const handleSwitchToProfile = () => {
      handleTabChange('profile');
    };
    
    window.addEventListener('switchToProfile', handleSwitchToProfile);
    return () => window.removeEventListener('switchToProfile', handleSwitchToProfile);
  }, [handleTabChange]);

  // Format selected date for API calls
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  
  console.log("Home Component - Selected date:", selectedDate);
  console.log("Home Component - Selected date string:", selectedDateString);
  console.log("Home Component - Today's date:", format(new Date(), 'yyyy-MM-dd'));
  console.log("Home Component - Session ID:", sessionId);

  // Fetch user profile for weight tracking
  const { data: userProfile } = useQuery({
    queryKey: [`/api/profile/${sessionId}`],
  });

  // Fetch usage stats to determine premium status
  const { data: usageStats } = useQuery({
    queryKey: ["/api/usage-stats"],
  });

  // Morning weight reminder logic
  useEffect(() => {
    const checkMorningReminder = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const lastWeightUpdate = localStorage.getItem(`lastWeightUpdate_${sessionId}`);
      const today = now.toDateString();
      
      // Show modal if it's morning (6-11 AM) and user hasn't logged weight today
      if (currentHour >= 6 && currentHour <= 11 && lastWeightUpdate !== today && userProfile) {
        const reminderShown = localStorage.getItem(`weightReminderShown_${today}_${sessionId}`);
        if (!reminderShown) {
          setTimeout(() => setShowWeightModal(true), 2000); // Show after 2 seconds
          localStorage.setItem(`weightReminderShown_${today}_${sessionId}`, 'true');
        }
      }
    };

    checkMorningReminder();
  }, [sessionId, userProfile]);

  // Get meal items for selected date
  const { data: mealItems, isLoading } = useQuery({
    queryKey: [`/api/meal/${sessionId}/${selectedDateString}`],
  });

  // Submit meal mutation
  const submitMealMutation = useMutation({
    mutationFn: async () => {
      // Calculate totals
      const totalCalories = (mealItems || []).reduce((sum: number, item: any) => 
        sum + ((item.food?.calories || 0) * (item.quantity || 1)), 0
      );
      const totalProtein = (mealItems || []).reduce((sum: number, item: any) => 
        sum + ((item.food?.protein || 0) * (item.quantity || 1)), 0
      );
      const totalCarbs = (mealItems || []).reduce((sum: number, item: any) => 
        sum + ((item.food?.carbs || 0) * (item.quantity || 1)), 0
      );
      const totalFat = (mealItems || []).reduce((sum: number, item: any) => 
        sum + ((item.food?.fat || 0) * (item.quantity || 1)), 0
      );

      await apiRequest(`/api/daily-summary`, {
        method: "POST",
        body: {
          sessionId,
          date: selectedDateString,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          caloriesBurned: 0,
          netCalories: totalCalories,
          mealData: JSON.stringify(mealItems || [])
        },
      });

      // DO NOT clear meals after submission - preserve all meal data
      // Meals should remain visible in today's nutrition summary
    },
    onSuccess: () => {
      toast({
        title: "Meal Submitted!",
        description: `Your meal has been added to ${format(selectedDate, 'MMM dd, yyyy')}'s summary. All food items remain visible.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDateString}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${selectedDateString}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
    },
  });

  // Clear meal mutation
  const clearMealMutation = useMutation({
    mutationFn: () => apiRequest(`/api/meal/clear/${sessionId}/${selectedDateString}`, { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Meal Cleared",
        description: `All items have been removed from ${format(selectedDate, 'MMM dd, yyyy')}'s meal.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDateString}`] });
    },
  });

  const handleMealItemAdded = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDateString}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/daily-summary`] });
  };

  // Handle editing a meal item
  const handleEditMeal = async (mealItem: any) => {
    try {
      // Remove the current meal item first
      await apiRequest("DELETE", `/api/meal/${mealItem.id}`);
      
      // Pre-populate the food search with the meal item's food data
      setSelectedFood({
        ...mealItem.food,
        quantity: mealItem.quantity,
        unit: mealItem.unit,
        isEditing: true,
        originalMealItem: mealItem
      });
      
      // Set editing state
      setEditingMealItem(mealItem);
      
      // Invalidate queries to refresh the meal list
      queryClient.invalidateQueries({ queryKey: [`/api/meal/${sessionId}/${selectedDateString}`] });
      
      // Auto-scroll to Food Search section and focus input for mobile UX
      setTimeout(() => {
        // Find the Food Search card container for better scroll positioning
        const foodSearchCard = document.querySelector('[data-food-search-card]') as HTMLElement;
        const foodSearchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        
        if (foodSearchCard || foodSearchInput) {
          const scrollTarget = foodSearchCard || foodSearchInput;
          
          // Scroll to the Food Search section smoothly with mobile-optimized positioning
          scrollTarget.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start', // Position at top for mobile screens
            inline: 'nearest'
          });
          
          // Focus on the input after scrolling with enhanced mobile support
          setTimeout(() => {
            if (foodSearchInput) {
              foodSearchInput.focus();
              foodSearchInput.select(); // Select any existing text for easier editing
              
              // Additional mobile keyboard support
              if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
                foodSearchInput.setAttribute('readonly', 'readonly');
                setTimeout(() => {
                  foodSearchInput.removeAttribute('readonly');
                  foodSearchInput.focus();
                }, 100);
              }
            }
          }, 600); // Extended wait for scroll animation on slower devices
        }
      }, 150); // Slightly longer delay to ensure DOM updates complete
      
      toast({
        title: "Edit Mode",
        description: `${mealItem.food.name} ready for editing in Food Search`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start editing meal item",
        variant: "destructive",
      });
    }
  };

  const handleWeightModalClose = () => {
    setShowWeightModal(false);
    // Mark as updated for today
    const today = new Date().toDateString();
    localStorage.setItem(`lastWeightUpdate_${sessionId}`, today);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-6">
        {/* Tracker Tab */}
        {activeTab === "tracker" && (
          <div className="animate-fade-in">
            {/* Tracker Header with Calendar */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-2xl">
                      <Utensils className="w-6 h-6 mr-3 text-primary" />
                      Food Tracker
                    </CardTitle>
                    
                  </div>
                  
                  {/* Date Selector */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[200px] justify-start text-left font-normal hover:bg-white/80 bg-[#9333ea] text-white border-purple-400"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {format(selectedDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <FoodSearch 
                  sessionId={sessionId} 
                  selectedDate={selectedDateString}
                  onFoodSelect={setSelectedFood}
                  onMealAdded={handleMealItemAdded}
                  onRedirectToDashboard={() => handleTabChange("dashboard")}
                  editingFood={selectedFood}
                />
                <FoodCamera 
                  sessionId={sessionId}
                  selectedDate={selectedDateString}
                  onFoodDetected={setSelectedFood}
                  onMealItemAdded={handleMealItemAdded}
                />
              </div>
              <div className="space-y-6">
                <MealSummary 
                  sessionId={sessionId} 
                  selectedDate={selectedDateString}
                  onSubmit={() => submitMealMutation.mutate()}
                  onClear={() => clearMealMutation.mutate()}
                  isSubmitting={submitMealMutation.isPending}
                  isClearing={clearMealMutation.isPending}
                  onEditMeal={handleEditMeal}
                />
              </div>
            </div>
            <div className="mt-6 space-y-6">
              <TrackerNutritionSummary sessionId={sessionId} selectedDate={selectedDateString} />
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="animate-fade-in">
            <UserProfile sessionId={sessionId} />
          </div>
        )}

        {/* Exercise Tab */}
        {activeTab === "exercise" && (
          <div className="animate-fade-in">
            {/* Date Picker Button - Top Right */}
            <div className="flex justify-end mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <ExerciseTracker sessionId={sessionId} selectedDate={selectedDateString} />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in">
            <Dashboard sessionId={sessionId} />
          </div>
        )}
      </main>
      
      {/* Morning Weight Update Modal */}
      <WeightUpdateModal
        isOpen={showWeightModal}
        onClose={handleWeightModalClose}
        sessionId={sessionId}
        currentProfile={userProfile}
      />

      {/* Hourly Activity Nudge Notification */}
      <HourlyNudgeNotification
        userId={sessionId}
      />
    </div>
  );
}

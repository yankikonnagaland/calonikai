import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCircle, Calculator, Target, TrendingDown, TrendingUp, Brain, Sparkles, Zap, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateProfileSchema } from "@shared/schema";
import type { UserProfile as UserProfileType } from "@shared/schema";
import { z } from "zod";

interface UserProfileProps {
  sessionId: string;
}

export default function UserProfile({ sessionId }: UserProfileProps) {
  const [aiInsights, setAiInsights] = useState<string>("");
  const [calculatedProfile, setCalculatedProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing profile from database
  const { data: existingProfile } = useQuery<UserProfileType>({
    queryKey: [`/api/profile/${sessionId}`],
    enabled: Boolean(sessionId),
  });

  const profileFormSchema = z.object({
    gender: z.string().min(1, "Please select gender"),
    age: z.string().min(1, "Please enter age").transform(val => parseInt(val)).refine(val => !isNaN(val) && val >= 13 && val <= 120, "Age must be between 13 and 120"),
    heightFeet: z.string().min(1, "Please select feet"),
    heightInches: z.string().min(1, "Please select inches"),
    weight: z.string().min(1, "Please enter weight").transform(val => parseFloat(val)).refine(val => !isNaN(val) && val >= 30 && val <= 300, "Weight must be between 30 and 300 kg"),
    activityLevel: z.string().min(1, "Please select activity level"),
    weightGoal: z.string().min(1, "Please select weight goal"),
    weightTarget: z.string().min(1, "Please enter target").transform(val => parseFloat(val)).refine(val => !isNaN(val) && val >= 1 && val <= 100, "Target must be between 1 and 100 kg"),
    customProteinTarget: z.string().optional().transform(val => val ? parseFloat(val) : undefined).refine(val => val === undefined || (!isNaN(val) && val >= 20 && val <= 300), "Protein target must be between 20 and 300 grams"),
  });

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      gender: existingProfile?.gender || "",
      age: existingProfile?.age?.toString() || "",
      heightFeet: existingProfile?.height ? Math.floor((existingProfile.height / 30.48)).toString() : "",
      heightInches: existingProfile?.height ? Math.round(((existingProfile.height / 30.48) % 1) * 12).toString() : "",
      weight: existingProfile?.weight?.toString() || "",
      activityLevel: existingProfile?.activityLevel || "",
      weightGoal: existingProfile?.weightGoal || "",
      weightTarget: existingProfile?.weightTarget?.toString() || "",
      customProteinTarget: existingProfile?.targetProtein?.toString() || "",
    },
  });

  // Update form when existing profile loads
  React.useEffect(() => {
    if (existingProfile) {
      form.reset({
        gender: existingProfile.gender || "",
        age: existingProfile.age?.toString() || "",
        heightFeet: existingProfile.height ? Math.floor((existingProfile.height / 30.48)).toString() : "",
        heightInches: existingProfile.height ? Math.round(((existingProfile.height / 30.48) % 1) * 12).toString() : "",
        weight: existingProfile.weight?.toString() || "",
        activityLevel: existingProfile.activityLevel || "",
        weightGoal: existingProfile.weightGoal || "",
        weightTarget: existingProfile.weightTarget?.toString() || "",
        customProteinTarget: existingProfile.targetProtein?.toString() || "",
      });
      setIsEditing(false);
    }
  }, [existingProfile, form]);

  const generateAIInsights = async (profile: any) => {
    try {
      const response = await fetch("/api/ai-profile-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights);
      } else {
        const fallbackInsights = generateFallbackInsights(profile);
        setAiInsights(fallbackInsights);
      }
    } catch (error) {
      const fallbackInsights = generateFallbackInsights(profile);
      setAiInsights(fallbackInsights);
    }
  };

  const generateFallbackInsights = (profile: any) => {
    const { weightGoal, targetCalories, tdee, age, activityLevel } = profile;
    
    let insights = [];
    
    if (weightGoal === 'lose') {
      insights.push("You're targeting a healthy calorie deficit for sustainable weight loss.");
      if (activityLevel === 'sedentary') {
        insights.push("Adding light exercise could boost your metabolism and help preserve muscle mass.");
      }
    } else if (weightGoal === 'gain') {
      insights.push("You're in a calorie surplus to support healthy weight gain and muscle building.");
      insights.push("Focus on strength training to ensure quality weight gain.");
    }
    
    if (age < 30) {
      insights.push("Your metabolism is naturally higher. Take advantage with consistent nutrition.");
    } else if (age > 50) {
      insights.push("Metabolism slows with age. Focus on protein intake and strength training.");
    }
    
    if (targetCalories < 1200) {
      insights.push("Very low calorie target. Consider a more moderate approach for sustainability.");
    }
    
    return insights.join(" ");
  };

  const calculateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert feet and inches to cm
      const totalInches = (parseInt(data.heightFeet) * 12) + parseInt(data.heightInches);
      const heightInCm = totalInches * 2.54;
      
      // Ensure proper type conversion for backend
      // Calculate protein target: 0.8g per kg body weight (default), or use custom value
      const weight = typeof data.weight === 'number' ? data.weight : parseFloat(data.weight);
      const defaultProteinTarget = Math.floor(weight * 0.8);
      const proteinTarget = data.customProteinTarget || defaultProteinTarget;

      const profileData = {
        gender: data.gender,
        age: typeof data.age === 'number' ? data.age : parseInt(data.age),
        height: heightInCm,
        weight: weight,
        bodyType: "average", // Default value as schema requires it
        activityLevel: data.activityLevel,
        weightGoal: data.weightGoal,
        weightTarget: typeof data.weightTarget === 'number' ? data.weightTarget : parseFloat(data.weightTarget),
        targetProtein: proteinTarget,
        sessionId
      };

      // Calculate BMR using Mifflin-St Jeor equation
      let bmr: number;
      if (profileData.gender === 'male') {
        bmr = 10 * profileData.weight + 6.25 * heightInCm - 5 * profileData.age + 5;
      } else {
        bmr = 10 * profileData.weight + 6.25 * heightInCm - 5 * profileData.age - 161;
      }

      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9
      };

      const tdee = bmr * (activityMultipliers[profileData.activityLevel] || 1.2);

      let targetCalories = tdee;
      if (profileData.weightGoal === 'lose') {
        targetCalories = tdee - 500;
      } else if (profileData.weightGoal === 'gain') {
        targetCalories = tdee + 500;
      }

      const results = {
        ...profileData,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetProtein: proteinTarget
      };

      // Save to database
      await apiRequest("POST", "/api/profile/calculate", profileData);
      
      return results;
    },
    onSuccess: (data) => {
      setCalculatedProfile(data);
      generateAIInsights(data);
      queryClient.invalidateQueries({ queryKey: ["/api/profile", sessionId] });
      
      toast({
        title: "Profile Calculated!",
        description: "Your personalized nutrition targets have been calculated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    calculateMutation.mutate(data);
  };

  const profileData = calculatedProfile || existingProfile;
  const isFormComplete = form.watch('gender') && form.watch('age') && form.watch('heightFeet') && 
                        form.watch('heightInches') && form.watch('weight') && form.watch('activityLevel') && 
                        form.watch('weightGoal') && form.watch('weightTarget');

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Your Health Profile
        </h1>
        {existingProfile ? (
          <div className="flex items-center justify-center gap-4">
            <p className="text-muted-foreground">
              Profile saved and active
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel Edit" : "Update Profile"}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Complete your profile for AI-powered nutrition insights
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results Panel - Left Side when profile exists */}
        {profileData && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="w-5 h-5 mr-2" />
                  Your Daily Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`grid gap-4 ${profileData.weightGoal === 'muscle' && profileData.targetProtein ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{profileData.bmr}</div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      BMR (cal/day)
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 cursor-help text-muted-foreground/40 hover:text-primary transition-colors duration-200 ease-in-out" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-popover border shadow-lg">
                          <p className="text-sm">
                            Basal Metabolic Rate (BMR)- The minimum calories your body needs to function at rest (breathing, blood circulation, brain function). Even if you do not exercise, your body will still burn calories to perform these functions
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{profileData.tdee}</div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      TDEE (cal/day)
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 cursor-help text-muted-foreground/40 hover:text-primary transition-colors duration-200 ease-in-out" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-popover border shadow-lg">
                          <p className="text-sm">
                            Total Daily Energy Expenditure - Amount of energy spent by your body which is your BMR plus calories burned through daily activities and exercise
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  {profileData.weightGoal === 'muscle' && profileData.targetProtein && (
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600">{profileData.targetProtein}g</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Protein Target</div>
                    </div>
                  )}
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border">
                  <div className="text-3xl font-bold text-primary">{profileData.targetCalories}</div>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    Daily Target Calories
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 cursor-help text-muted-foreground/40 hover:text-primary transition-colors duration-200 ease-in-out" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-popover border shadow-lg">
                        <p className="text-sm">
                          This is the number of calories you should eat each day based on your goal
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge variant={
                    profileData.weightGoal === 'lose' ? 'destructive' : 
                    profileData.weightGoal === 'muscle' ? 'secondary' : 'default'
                  } className="mt-2">
                    {profileData.weightGoal === 'lose' ? 'Deficit' : 
                     profileData.weightGoal === 'muscle' ? 'Lean Surplus' : 'Surplus'}: {Math.abs(profileData.tdee - profileData.targetCalories)} cal
                  </Badge>
                </div>
                
                {/* Protein Target for Muscle Building */}
                {profileData.weightGoal === 'muscle' && profileData.targetProtein && (
                  <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600">{profileData.targetProtein}g</div>
                    <div className="text-sm text-muted-foreground">Daily Protein Target</div>
                    <Badge variant="outline" className="mt-2 border-blue-500 text-blue-600">
                      Muscle Building: 2g per kg body weight
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            {aiInsights && (
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    AI Insights
                    <Sparkles className="w-4 h-4 ml-1 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {aiInsights}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Profile Form - Right Side */}
        <div className={profileData ? "" : "lg:col-span-2"}>
          {existingProfile && !isEditing ? (
            // Display saved profile
            (<Card className="shadow-lg border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800 dark:text-green-200">
                  <UserCircle className="w-5 h-5 mr-2" />
                  Your Saved Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="text-lg capitalize">{existingProfile.gender}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Age</label>
                      <p className="text-lg">{existingProfile.age} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Height</label>
                      <p className="text-lg">{Math.floor(existingProfile.height / 30.48)}'{Math.round(((existingProfile.height / 30.48) % 1) * 12)}" ({existingProfile.height.toFixed(2)} cm)</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Weight</label>
                      <p className="text-lg">{existingProfile.weight} kg</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Activity Level</label>
                      <p className="text-lg capitalize">{existingProfile.activityLevel.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Weight Goal</label>
                      <p className="text-lg capitalize">{existingProfile.weightGoal} weight</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Target</label>
                      <p className="text-lg">{existingProfile.weightTarget} kg to {existingProfile.weightGoal}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>)
          ) : (
            // Show form for new profile or editing
            (<Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircle className="w-5 h-5 mr-2" />
                  {isEditing ? "Update Profile" : "Quick Setup"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Goal Selection */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">What's your goal?</h3>
                      <FormField
                        control={form.control}
                        name="weightGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-3 gap-3">
                                <div 
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    field.value === "lose" ? "border-red-500 bg-red-50 dark:bg-red-950" : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => field.onChange("lose")}
                                >
                                  <div className="text-center">
                                    <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-500" />
                                    <span className="font-medium">Lose Weight</span>
                                  </div>
                                </div>
                                <div 
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    field.value === "gain" ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => field.onChange("gain")}
                                >
                                  <div className="text-center">
                                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <span className="font-medium">Gain Weight</span>
                                  </div>
                                </div>
                                <div 
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    field.value === "muscle" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => field.onChange("muscle")}
                                >
                                  <div className="text-center">
                                    <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                                    <span className="font-medium">Build Muscle</span>
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <NumberInput placeholder="Enter your age" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="heightFeet"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height (Feet)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Feet" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[4, 5, 6, 7].map(feet => (
                                    <SelectItem key={feet} value={feet.toString()}>{feet} ft</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="heightInches"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inches</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="In" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[...Array(12)].map((_, i) => (
                                    <SelectItem key={i} value={i.toString()}>{i} in</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <NumberInput placeholder="Enter weight in kg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="activityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sedentary">Sedentary (Desk job)</SelectItem>
                                <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                                <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                                <SelectItem value="very">Very Active (6-7 days/week)</SelectItem>
                                <SelectItem value="extra">Extremely Active (2x/day)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weightTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {form.watch("weightGoal") === "muscle" 
                                ? "Target (kg muscle to gain)" 
                                : `Target (kg to ${form.watch("weightGoal") === "lose" ? "lose" : "gain"})`
                              }
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={form.watch("weightGoal") === "muscle" ? "Enter muscle gain target" : "Enter weight target"} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customProteinTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Protein Target (grams)</FormLabel>
                            <FormControl>
                              <NumberInput 
                                placeholder="Enter protein target (optional)"
                                {...field} 
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              Leave empty to use automatic calculation (0.8g per kg body weight)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Calculate Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg"
                        disabled={calculateMutation.isPending || !isFormComplete}
                      >
                        {calculateMutation.isPending ? (
                          <>
                            <Calculator className="w-5 h-5 mr-2 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            Calculate My Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>)
          )}
          {/* Show placeholder when no profile data */}
          {!profileData && (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Fill out your profile and click calculate to see personalized results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
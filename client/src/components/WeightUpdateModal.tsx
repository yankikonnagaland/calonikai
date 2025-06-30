import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WeightUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentProfile?: any;
}

export default function WeightUpdateModal({ isOpen, onClose, sessionId, currentProfile }: WeightUpdateModalProps) {
  const [weight, setWeight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && currentProfile) {
      setWeight(currentProfile.weight?.toString() || "");
      setPreviousWeight(currentProfile.weight || null);
    }
  }, [isOpen, currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const weightValue = parseFloat(weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        toast({
          title: "Invalid Weight",
          description: "Please enter a valid weight",
          variant: "destructive",
        });
        return;
      }

      // Save daily weight
      const currentDate = new Date().toISOString().split('T')[0];
      await apiRequest("POST", "/api/daily-weight", {
        sessionId,
        weight: weightValue,
        date: currentDate
      });

      // Only update profile weight if all required fields are present
      if (currentProfile && currentProfile.gender && currentProfile.age && currentProfile.height && currentProfile.activityLevel && currentProfile.weightGoal) {
        const updatedProfile = {
          gender: currentProfile.gender,
          age: currentProfile.age,
          height: currentProfile.height,
          weight: weightValue,
          bodyType: currentProfile.bodyType || 'average',
          activityLevel: currentProfile.activityLevel,
          weightGoal: currentProfile.weightGoal,
          weightTarget: currentProfile.weightTarget || null,
          targetProtein: currentProfile.targetProtein || null,
          sessionId: sessionId,
        };

        try {
          await apiRequest("POST", "/api/profile/calculate", updatedProfile);
        } catch (profileError) {
          console.log("Profile update skipped - will continue with weight logging");
          // Continue execution even if profile update fails
        }
      }

      // Check for weight goal progress
      let congratsMessage = "";
      let variant: "default" | "destructive" = "default";
      
      if (previousWeight && currentProfile?.weightGoal) {
        const weightChange = weightValue - previousWeight;
        const goalType = currentProfile.weightGoal;
        
        if (goalType === 'lose' && weightChange < 0) {
          congratsMessage = `🎯 Great job! You've lost ${Math.abs(weightChange).toFixed(1)} kg!`;
        } else if (goalType === 'gain' && weightChange > 0) {
          congratsMessage = `💪 Excellent! You've gained ${weightChange.toFixed(1)} kg!`;
        } else if (goalType === 'maintain' && Math.abs(weightChange) <= 0.2) {
          congratsMessage = `⚖️ Perfect! You're maintaining your weight beautifully!`;
        } else {
          congratsMessage = "Weight logged successfully! Keep staying consistent.";
        }
      } else {
        congratsMessage = "Weight logged successfully!";
      }

      toast({
        title: "Weight Updated",
        description: congratsMessage,
        variant,
      });

      // Goal achievement checking is handled by the weight progress logic above

      // Invalidate cache to refresh all weight-related data
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-weight/${sessionId}/${currentDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-weights/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summary/${sessionId}/${currentDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-summaries/${sessionId}`] });
      
      onClose();
    } catch (error) {
      console.error("Error updating weight:", error);
      toast({
        title: "Error",
        description: "Failed to update weight",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWeightChangeIcon = () => {
    if (!previousWeight || !weight) return <Scale className="w-5 h-5" />;
    
    const currentWeight = parseFloat(weight);
    const change = currentWeight - previousWeight;
    
    if (Math.abs(change) <= 0.1) return <Minus className="w-5 h-5 text-blue-500" />;
    if (change > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
    return <TrendingDown className="w-5 h-5 text-orange-500" />;
  };

  const getMotivationalMessage = () => {
    if (!currentProfile?.weightGoal) return "Track your daily weight for better health insights!";
    
    const goalType = currentProfile.weightGoal;
    if (goalType === 'lose') return "Every step counts towards your weight loss goal! 🎯";
    if (goalType === 'gain') return "Consistency is key to healthy weight gain! 💪";
    return "Maintaining your weight shows great discipline! ⚖️";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            {getWeightChangeIcon()}
            Morning Check-in
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {getMotivationalMessage()}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Current Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="1"
                max="500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter your weight"
                className="text-center text-lg"
                required
              />
              {previousWeight && weight && (
                <div className="text-sm text-center text-muted-foreground">
                  Previous: {previousWeight} kg
                  {parseFloat(weight) !== previousWeight && (
                    <span className={`ml-2 font-medium ${
                      parseFloat(weight) > previousWeight ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      ({parseFloat(weight) > previousWeight ? '+' : ''}{(parseFloat(weight) - previousWeight).toFixed(1)} kg)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || !weight}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? "Saving..." : "Update Weight"}
              </Button>
              <Button type="button" onClick={onClose} variant="outline">
                Later
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
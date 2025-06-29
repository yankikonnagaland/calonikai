import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, X, Zap, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HourlyActivity {
  id: number;
  activityNumber: number;
  description: string;
  emoji: string;
  category: string;
  createdAt: string;
}

interface HourlyNudgeNotificationProps {
  userId: string;
  isPremium: boolean;
}

export default function HourlyNudgeNotification({ userId, isPremium }: HourlyNudgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [currentActivity, setCurrentActivity] = useState<HourlyActivity | null>(null);

  // Fetch random activity for nudge
  const { data: randomActivity, refetch: getRandomActivity } = useQuery<HourlyActivity>({
    queryKey: ["/api/hourly-activities/random"],
    enabled: false
  });

  // Check if user should see hourly nudge
  const shouldShowNudge = () => {
    if (!isPremium) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Show only from 10 AM to 9 PM
    if (currentHour < 10 || currentHour > 21) return false;
    
    // Show on the hour (first 15 minutes) and every 30 minutes
    const showTimes = [0, 30]; // Show at :00 and :30
    const isShowTime = showTimes.some(time => 
      currentMinutes >= time && currentMinutes < time + 15
    );
    
    if (!isShowTime) return false;
    
    // Check if already dismissed this hour
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 0.5) return false; // Don't show for 30 minutes after dismissal
    }
    
    return true;
  };

  // Check for nudge display every minute
  useEffect(() => {
    const checkNudge = async () => {
      if (shouldShowNudge() && !isVisible) {
        await getRandomActivity();
        setIsVisible(true);
      }
    };

    const interval = setInterval(checkNudge, 60000); // Check every minute
    checkNudge(); // Initial check

    return () => clearInterval(interval);
  }, [isPremium, isVisible, dismissedAt, getRandomActivity]);

  // Update current activity when random activity is fetched
  useEffect(() => {
    if (randomActivity) {
      setCurrentActivity(randomActivity);
    }
  }, [randomActivity]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissedAt(new Date().toISOString());
  };

  const handleTryActivity = () => {
    // Optional: Track that user engaged with the activity
    // Could add analytics or exercise logging here
    setIsVisible(false);
    setDismissedAt(new Date().toISOString());
  };

  const getCurrentTimeDisplay = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour === 12 ? '12 PM' : 
           hour > 12 ? `${hour - 12} PM` : 
           `${hour} AM`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kungfu': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cleaning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'general': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isPremium || !isVisible || !currentActivity) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-4 right-4 z-50 w-80"
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-xl">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Hourly Move</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                    {getCurrentTimeDisplay()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Activity Content */}
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{currentActivity.emoji}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Activity #{currentActivity.activityNumber}
                  </Badge>
                  <Badge className={getCategoryColor(currentActivity.category)}>
                    {currentActivity.category}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-center">
                  {currentActivity.description}
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Quick Benefits
                  </span>
                </div>
                <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Boost metabolism & burn calories</li>
                  <li>• Improve focus & productivity</li>
                  <li>• Reduce stress & increase energy</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleTryActivity}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Try It Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  size="sm"
                  className="px-3"
                >
                  Later
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
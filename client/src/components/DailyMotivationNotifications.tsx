import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Coffee, 
  Sun, 
  Moon, 
  Target, 
  Zap, 
  Heart,
  TrendingUp,
  Award,
  Clock,
  Sparkles
} from "lucide-react";

interface DailyMotivationProps {
  sessionId: string;
  isEnabled?: boolean;
}

interface NotificationSchedule {
  id: string;
  time: string; // HH:MM format
  type: 'morning' | 'afternoon' | 'evening';
  title: string;
  message: string;
  icon: React.ReactNode;
  action?: string;
}

const motivationalMessages = {
  morning: [
    {
      title: "Good Morning! ☀️",
      message: "Start your day strong! Log your breakfast and fuel your body right.",
      action: "Add breakfast now"
    },
    {
      title: "Rise & Shine! 🌅",
      message: "Your health journey begins with the first meal. What are you having?",
      action: "Track morning meal"
    },
    {
      title: "Morning Energy! ⚡",
      message: "Kickstart your metabolism! Don't forget to log your morning nutrition.",
      action: "Log breakfast"
    },
    {
      title: "New Day, New Goals! 🎯",
      message: "Yesterday is history, today is opportunity. Track your breakfast!",
      action: "Start tracking"
    }
  ],
  afternoon: [
    {
      title: "Midday Check-in! 🕐",
      message: "How's your day going? Time to log lunch and stay on track!",
      action: "Add lunch"
    },
    {
      title: "Fuel Your Afternoon! 🔥",
      message: "Keep your energy up! Log your lunch and afternoon snacks.",
      action: "Track meals"
    },
    {
      title: "Halfway There! 💪",
      message: "You're doing great! Don't forget to log your midday nutrition.",
      action: "Log lunch now"
    },
    {
      title: "Stay Consistent! 📈",
      message: "Small actions, big results. Time to track your afternoon intake!",
      action: "Continue tracking"
    }
  ],
  evening: [
    {
      title: "Evening Wrap-up! 🌙",
      message: "End your day strong! Log dinner and review your progress.",
      action: "Add dinner"
    },
    {
      title: "Complete Your Day! ⭐",
      message: "You're almost there! Log your evening meal and celebrate progress.",
      action: "Finish tracking"
    },
    {
      title: "Dinner Time! 🍽️",
      message: "Cap off a great day with mindful eating. Log your dinner now!",
      action: "Track dinner"
    },
    {
      title: "Daily Goal Check! 🏆",
      message: "How close are you to your calorie goal? Log dinner to find out!",
      action: "Complete day"
    }
  ]
};

const exerciseMotivation = [
  "Move your body, change your life! 💪",
  "Every step counts towards your goal! 🚶‍♀️",
  "You're stronger than your excuses! 🔥",
  "Progress, not perfection! 📈",
  "Your future self will thank you! ⭐",
  "Consistency is key to success! 🗝️"
];

export default function DailyMotivationNotifications({ 
  sessionId, 
  isEnabled = true 
}: DailyMotivationProps) {
  const { toast } = useToast();
  const [lastNotificationDate, setLastNotificationDate] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Get user's usage data to personalize notifications
  const { data: usageStats } = useQuery({
    queryKey: ['/api/usage-stats'],
    enabled: isEnabled && !!sessionId,
  });

  // Get today's meal data to customize notifications
  const { data: todayMeals } = useQuery({
    queryKey: [`/api/meal/${sessionId}/${new Date().toISOString().split('T')[0]}`],
    enabled: isEnabled && !!sessionId,
  });

  // Get today's exercises to customize notifications
  const { data: todayExercises } = useQuery({
    queryKey: [`/api/exercise/${sessionId}/${new Date().toISOString().split('T')[0]}`],
    enabled: isEnabled && !!sessionId,
  });

  const schedules: NotificationSchedule[] = [
    {
      id: 'morning',
      time: '08:30',
      type: 'morning',
      title: 'Good Morning!',
      message: 'Start your day strong! Log your breakfast and fuel your body right.',
      icon: <Coffee className="h-5 w-5" />,
      action: 'Add breakfast'
    },
    {
      id: 'afternoon', 
      time: '13:00',
      type: 'afternoon',
      title: 'Midday Check-in!',
      message: 'How\'s your day going? Time to log lunch and stay on track!',
      icon: <Sun className="h-5 w-5" />,
      action: 'Add lunch'
    },
    {
      id: 'evening',
      time: '19:30',
      type: 'evening', 
      title: 'Evening Wrap-up!',
      message: 'End your day strong! Log dinner and review your progress.',
      icon: <Moon className="h-5 w-5" />,
      action: 'Add dinner'
    }
  ];

  const getRandomMessage = (type: 'morning' | 'afternoon' | 'evening') => {
    const messages = motivationalMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getPersonalizedMessage = (type: 'morning' | 'afternoon' | 'evening') => {
    const baseMessage = getRandomMessage(type);
    const mealCount = Array.isArray(todayMeals) ? todayMeals.length : 0;
    const exerciseCount = Array.isArray(todayExercises) ? todayExercises.length : 0;
    const isPremium = usageStats?.isPremium || false;

    // Customize message based on user's current progress
    let customMessage = baseMessage.message;
    let customAction = baseMessage.action;

    if (type === 'morning' && mealCount === 0) {
      customMessage = "Your journey to better health starts now! Log your first meal of the day.";
      customAction = "Start your day right";
    } else if (type === 'afternoon' && mealCount > 0) {
      customMessage = `Great start! You've logged ${mealCount} meal${mealCount > 1 ? 's' : ''} today. Keep the momentum going!`;
      customAction = "Continue tracking";
    } else if (type === 'evening' && exerciseCount === 0) {
      customMessage = "Don't forget to move your body today! Log dinner and maybe add some exercise.";
      customAction = "Add dinner & exercise";
    }

    // Add premium user encouragement
    if (isPremium && Math.random() > 0.7) {
      const exerciseMsg = exerciseMotivation[Math.floor(Math.random() * exerciseMotivation.length)];
      customMessage += ` ${exerciseMsg}`;
    }

    return {
      ...baseMessage,
      message: customMessage,
      action: customAction
    };
  };

  const shouldShowNotification = (schedule: NotificationSchedule): boolean => {
    if (!isEnabled || !sessionId) return false;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if it's time for this notification (within 15 minutes window)
    const [scheduleHour, scheduleMin] = schedule.time.split(':').map(Number);
    const scheduleTime = scheduleHour * 60 + scheduleMin;
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    const timeDiff = Math.abs(currentTimeMinutes - scheduleTime);
    const isTimeWindow = timeDiff <= 15; // 15-minute window
    
    // Don't show if already shown today
    const notificationKey = `${today}-${schedule.id}`;
    const hasShownToday = localStorage.getItem(`notification-${notificationKey}`) === 'shown';
    
    // Don't show same notification type multiple times in a day
    if (hasShownToday) return false;
    
    return isTimeWindow;
  };

  const showNotification = (schedule: NotificationSchedule) => {
    const personalizedMsg = getPersonalizedMessage(schedule.type);
    const today = new Date().toISOString().split('T')[0];
    const notificationKey = `${today}-${schedule.id}`;

    toast({
      title: personalizedMsg.title,
      description: `${personalizedMsg.message} • Daily motivation at ${schedule.time}`,
      duration: 8000, // Show for 8 seconds
    });

    // Mark as shown for today
    localStorage.setItem(`notification-${notificationKey}`, 'shown');
    setNotificationCount(prev => prev + 1);
    setLastNotificationDate(today);
  };

  // Check for notifications every minute
  useEffect(() => {
    if (!isEnabled) return;

    const checkNotifications = () => {
      schedules.forEach(schedule => {
        if (shouldShowNotification(schedule)) {
          showNotification(schedule);
        }
      });
    };

    // Initial check
    checkNotifications();

    // Set up interval to check every minute
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [isEnabled, sessionId, todayMeals, todayExercises, usageStats]);

  // Show welcome notification for new users
  useEffect(() => {
    if (!isEnabled || !sessionId) return;

    const hasSeenWelcome = localStorage.getItem(`welcome-notification-${sessionId}`);
    
    if (!hasSeenWelcome && usageStats) {
      setTimeout(() => {
        toast({
          title: "Welcome to Calonik.ai! ✨",
          description: "I'll help you stay motivated with 3 daily reminders to track your nutrition and exercise! Your health journey starts now ❤️",
          duration: 10000,
        });
        
        localStorage.setItem(`welcome-notification-${sessionId}`, 'shown');
      }, 2000); // Show after 2 seconds
    }
  }, [sessionId, usageStats, isEnabled]);

  // Debug info for development (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Daily Motivation Notifications:', {
        isEnabled,
        sessionId,
        notificationCount,
        lastNotificationDate,
        todayMealsCount: Array.isArray(todayMeals) ? todayMeals.length : 0,
        todayExercisesCount: Array.isArray(todayExercises) ? todayExercises.length : 0,
        isPremium: usageStats?.isPremium || false
      });
    }
  }, [isEnabled, sessionId, notificationCount, todayMeals, todayExercises, usageStats]);

  // This component doesn't render any UI, it just manages notifications
  return null;
}
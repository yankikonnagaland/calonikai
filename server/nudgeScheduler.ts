import { storage } from "./storage";
import { sendDailyCalorieReminder } from "./emailService";

// Simple scheduler for daily nudges
let scheduledInterval: NodeJS.Timeout | null = null;

export function startNudgeScheduler() {
  // Stop existing scheduler if running
  if (scheduledInterval) {
    clearInterval(scheduledInterval);
  }

  // Check every hour for users who need nudges
  scheduledInterval = setInterval(async () => {
    try {
      await checkAndSendDailyNudges();
    } catch (error) {
      console.error("Error in nudge scheduler:", error);
    }
  }, 60 * 60 * 1000); // Every hour

  console.log("Daily nudge scheduler started");
}

export function stopNudgeScheduler() {
  if (scheduledInterval) {
    clearInterval(scheduledInterval);
    scheduledInterval = null;
    console.log("Daily nudge scheduler stopped");
  }
}

async function checkAndSendDailyNudges() {
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0];

  // Send nudges at 9 AM and 6 PM
  if (currentHour !== 9 && currentHour !== 18) {
    return;
  }

  console.log(`Checking for daily nudges at ${currentHour}:00`);

  try {
    // Add timeout protection for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 8000);
    });

    const usersPromise = storage.getAllUsers();
    const users = await Promise.race([usersPromise, timeoutPromise]) as any[];
    
    console.log(`Found ${users.length} users for nudge check`);
    
    let nudgesSent = 0;
    for (const user of users) {
      if (user.email && shouldSendNudge(user, today)) {
        try {
          await sendDailyCalorieReminder(user.email, user.firstName || 'there');
          nudgesSent++;
          console.log(`Nudge sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send nudge to ${user.email}:`, emailError);
        }
      }
    }
    
    console.log(`Daily nudge check completed for ${today} at ${currentHour}:00 - ${nudgesSent} nudges sent`);
    
  } catch (error) {
    console.error("Error in checkAndSendDailyNudges:", error);
    console.log("Nudge scheduler will continue running and retry next hour");
  }
}

function shouldSendNudge(user: any, today: string): boolean {
  // Check if user has logged meals or exercises today
  // This would require checking their daily summary or last activity
  
  // Only send nudges to users who have been active in the last 7 days
  // and haven't logged anything today (simplified logic)
  
  // For development, we'll be conservative and only enable for premium users
  // or users who explicitly opted in
  const isPremium = user.subscription_status === 'premium';
  
  // Enable nudges for premium users only for now
  if (isPremium) {
    return true;
  }
  
  return false;
}

// Scheduler will be started manually from server/index.ts
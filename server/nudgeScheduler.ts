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
    // For now, we'll send to active users (this is a simplified version)
    // In a real implementation, you'd fetch all users and check their last activity
    
    // Since we don't have a user list endpoint, we'll just log the scheduler is working
    console.log(`Daily nudge check completed for ${today} at ${currentHour}:00`);
    
    // Example of how to send when we have user data:
    // const users = await storage.getAllUsers(); // This would need to be implemented
    // for (const user of users) {
    //   if (user.email && shouldSendNudge(user, today)) {
    //     await sendDailyCalorieReminder(user.email, user.firstName || 'there');
    //   }
    // }
    
  } catch (error) {
    console.error("Error in checkAndSendDailyNudges:", error);
  }
}

function shouldSendNudge(user: any, today: string): boolean {
  // Check if user has logged meals or exercises today
  // This would require checking their daily summary or last activity
  // For now, return false to avoid spam during development
  return false;
}

// Scheduler will be started manually from server/index.ts
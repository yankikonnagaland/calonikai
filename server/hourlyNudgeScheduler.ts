import { db } from "./db";
import { hourlyActivities } from "../shared/schema";
import { sendEmail } from "./emailService";
import { eq } from "drizzle-orm";

let hourlyNudgeInterval: NodeJS.Timeout | null = null;

export function startHourlyNudgeScheduler() {
  if (hourlyNudgeInterval) {
    console.log("Hourly nudge scheduler already running");
    return;
  }

  // Check every 5 minutes for hourly nudges
  hourlyNudgeInterval = setInterval(async () => {
    await checkAndSendHourlyNudges();
  }, 5 * 60 * 1000); // 5 minutes

  console.log("Hourly nudge scheduler started - checking every 5 minutes");
}

export function stopHourlyNudgeScheduler() {
  if (hourlyNudgeInterval) {
    clearInterval(hourlyNudgeInterval);
    hourlyNudgeInterval = null;
    console.log("Hourly nudge scheduler stopped");
  }
}

export async function checkAndSendHourlyNudges() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Only send nudges from 10 AM to 9 PM, on the hour (within first 5 minutes)
    if (currentHour < 10 || currentHour > 21 || currentMinutes > 5) {
      return;
    }

    console.log(`Checking hourly nudges at ${currentHour}:${currentMinutes.toString().padStart(2, '0')}`);

    // Get all premium users who should receive hourly nudges
    const premiumUsers = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.subscriptionStatus, 'premium')
    });

    if (premiumUsers.length === 0) {
      console.log("No premium users found for hourly nudges");
      return;
    }

    // Get a random activity for this hour
    const randomActivity = await getRandomActivity();
    if (!randomActivity) {
      console.log("No activities found in database");
      return;
    }

    // Send hourly nudge to all premium users
    const hourlyNudgePromises = premiumUsers.map(user => 
      sendHourlyActivityNudge(user.email, user.firstName || 'there', randomActivity)
    );

    const results = await Promise.allSettled(hourlyNudgePromises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Hourly nudges sent: ${successful} successful, ${failed} failed`);
    
  } catch (error) {
    console.error("Error in hourly nudge scheduler:", error);
  }
}

async function getRandomActivity() {
  try {
    // Get a random activity from the database
    const activities = await db.select().from(hourlyActivities);
    
    if (activities.length === 0) {
      return null;
    }

    // Return a random activity
    const randomIndex = Math.floor(Math.random() * activities.length);
    return activities[randomIndex];
  } catch (error) {
    console.error("Error fetching random activity:", error);
    return null;
  }
}

async function sendHourlyActivityNudge(
  userEmail: string, 
  userName: string, 
  activity: any
): Promise<boolean> {
  try {
    const currentHour = new Date().getHours();
    const timeDisplay = currentHour === 12 ? '12 PM' : 
                       currentHour > 12 ? `${currentHour - 12} PM` : 
                       `${currentHour} AM`;

    const subject = `${activity.emoji} Hourly Activity Reminder - ${timeDisplay}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; overflow: hidden;">
        <div style="padding: 30px; text-align: center;">
          <h1 style="margin: 0 0 20px 0; font-size: 28px;">Calonik.ai Hourly Move</h1>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${activity.emoji}</div>
            <h2 style="margin: 0 0 15px 0; color: #ffd700;">Activity #${activity.activityNumber}</h2>
            <p style="font-size: 18px; margin: 0; line-height: 1.5;">${activity.description}</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Time:</strong> ${timeDisplay} • <strong>Category:</strong> ${activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
            </p>
          </div>

          <div style="text-align: left; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #ffd700;">Why Move Every Hour?</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Boost metabolism and burn extra calories</li>
              <li>Improve focus and productivity</li>
              <li>Reduce stress and increase energy</li>
              <li>Break up sedentary time for better health</li>
            </ul>
          </div>

          <p style="font-size: 16px; margin: 20px 0;">
            Hi ${userName}! Take a quick movement break and try this fun activity. Your body will thank you! 💪
          </p>
          
          <div style="margin-top: 30px;">
            <a href="https://calonik.ai" style="background: #ffd700; color: #333; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Track Your Progress
            </a>
          </div>
        </div>
        
        <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Calonik.ai - Your Smart Calorie & Fitness Companion</p>
          <p style="margin: 0; opacity: 0.8;">Hourly movement reminders for premium users • 10 AM - 9 PM</p>
        </div>
      </div>
    `;

    const textContent = `
Calonik.ai Hourly Move - ${timeDisplay}

${activity.emoji} Activity #${activity.activityNumber}
${activity.description}

Category: ${activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}

Hi ${userName}! Take a quick movement break and try this fun activity. Your body will thank you!

Why move every hour?
• Boost metabolism and burn extra calories
• Improve focus and productivity  
• Reduce stress and increase energy
• Break up sedentary time for better health

Track your progress at https://calonik.ai

Calonik.ai - Your Smart Calorie & Fitness Companion
Hourly movement reminders for premium users • 10 AM - 9 PM
    `;

    return await sendEmail({
      to: userEmail,
      from: 'noreply@calonik.ai',
      subject,
      html: htmlContent,
      text: textContent
    });

  } catch (error) {
    console.error(`Error sending hourly nudge to ${userEmail}:`, error);
    return false;
  }
}

// Test function to manually trigger an hourly nudge
export async function testHourlyNudge(userEmail: string, userName: string = 'there') {
  const activity = await getRandomActivity();
  if (activity) {
    return await sendHourlyActivityNudge(userEmail, userName, activity);
  }
  return false;
}
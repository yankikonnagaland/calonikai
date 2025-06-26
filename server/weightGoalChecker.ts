/**
 * Weight Goal Achievement Checker
 * Automatically detects when users achieve their weight goals and marks them as completed
 */

import { storage } from "./storage";
import type { UserProfile, DailyWeight } from "@shared/schema";

export interface WeightGoalResult {
  achieved: boolean;
  message?: string;
  shouldClearGoal?: boolean;
}

/**
 * Check if a user has achieved their weight goal based on current weight
 */
export async function checkWeightGoalAchievement(
  sessionId: string, 
  currentWeight: number,
  profile: UserProfile
): Promise<WeightGoalResult> {
  if (!profile.weightGoal || !profile.weightTarget || !profile.weight || profile.goalAchieved) {
    return { achieved: false };
  }

  const startingWeight = profile.weight;
  const targetWeight = profile.weightTarget;
  const goalType = profile.weightGoal;

  let achieved = false;
  let message = "";

  switch (goalType) {
    case 'lose':
      // Goal achieved if current weight is at or below target
      const weightLost = startingWeight - currentWeight;
      if (weightLost >= targetWeight) {
        achieved = true;
        message = `🎉 Congratulations! You've achieved your weight loss goal of ${targetWeight}kg! You've lost ${weightLost.toFixed(1)}kg total.`;
      }
      break;

    case 'gain':
      // Goal achieved if current weight is at or above target
      const weightGained = currentWeight - startingWeight;
      if (weightGained >= targetWeight) {
        achieved = true;
        message = `🎉 Amazing! You've achieved your weight gain goal of ${targetWeight}kg! You've gained ${weightGained.toFixed(1)}kg total.`;
      }
      break;

    case 'maintain':
      // Goal achieved if weight stays within 1kg of starting weight for 30 days
      const weightDifference = Math.abs(currentWeight - startingWeight);
      if (weightDifference <= 1.0) {
        // Check if they've been maintaining for a reasonable period
        const recentWeights = await storage.getDailyWeights(sessionId);
        const last30Days = recentWeights.slice(0, 30);
        
        if (last30Days.length >= 20) { // At least 20 weight entries in recent period
          const allWithinRange = last30Days.every(w => Math.abs(w.weight - startingWeight) <= 1.0);
          if (allWithinRange) {
            achieved = true;
            message = `🎉 Excellent! You've successfully maintained your weight within 1kg for over 20 days! Great discipline.`;
          }
        }
      }
      break;
  }

  return {
    achieved,
    message,
    shouldClearGoal: achieved
  };
}

/**
 * Mark weight goal as achieved and optionally clear it
 */
export async function markGoalAsAchieved(sessionId: string): Promise<void> {
  try {
    const profile = await storage.getUserProfile(sessionId);
    if (!profile) return;

    // Update profile to mark goal as achieved
    const updatedProfile = {
      ...profile,
      goalAchieved: true,
      goalAchievedAt: new Date(),
      bmr: profile.bmr || 0,
      tdee: profile.tdee || 0,
      targetCalories: profile.targetCalories || 0
    };
    await storage.saveUserProfile(updatedProfile);

    console.log(`Weight goal marked as achieved for session: ${sessionId}`);
  } catch (error) {
    console.error("Error marking goal as achieved:", error);
  }
}

/**
 * Clear achieved weight goal to allow setting new targets
 */
export async function clearAchievedGoal(sessionId: string): Promise<void> {
  try {
    const profile = await storage.getUserProfile(sessionId);
    if (!profile) return;

    // Clear goal fields while preserving other profile data
    const updatedProfile = {
      ...profile,
      weightGoal: 'maintain', // Reset to maintain as default
      weightTarget: null,
      goalAchieved: false,
      goalAchievedAt: null,
      bmr: profile.bmr || 0,
      tdee: profile.tdee || 0,
      targetCalories: profile.targetCalories || 0
    };
    await storage.saveUserProfile(updatedProfile);

    console.log(`Weight goal cleared for session: ${sessionId}`);
  } catch (error) {
    console.error("Error clearing achieved goal:", error);
  }
}
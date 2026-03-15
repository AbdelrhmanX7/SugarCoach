// Pure utility functions and constants for gamification.
// This file has NO server-side imports so it can be safely imported in client components.

// XP reward amounts for various actions
export const XP_REWARDS = {
  BLOOD_SUGAR_LOG: 5,
  INSULIN_LOG: 5,
  MEAL_LOG: 10,
  MEAL_LOG_WITH_IMAGE: 15,
  STREAK_DAY: 20,
  ACHIEVEMENT_UNLOCK: 50,
  CGM_IMPORT: 25,
  DIET_PLAN_CREATE: 30,
};

/**
 * Calculate the user's level from their total XP.
 * Level 1 starts at 0 XP, level 2 at 100 XP, level 3 at 400 XP, etc.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate the total XP needed to reach the next level.
 * e.g., level 2 requires 100 XP total, level 3 requires 400 XP total.
 */
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * currentLevel * 100;
}

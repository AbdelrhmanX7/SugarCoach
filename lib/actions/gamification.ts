"use server";

import type { Achievement } from "@/types/database";

import { createClient } from "@/lib/supabase/server";
import {
  awardXP,
  checkAchievements,
  updateStreak,
  XP_REWARDS,
} from "@/lib/gamification/engine";

export type GamificationStatus = {
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  achievementCount: number;
  totalAchievements: number;
};

export type AchievementWithStatus = Achievement & {
  earned: boolean;
  earned_at: string | null;
};

export type LogRewardResult = {
  xpAwarded: number;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  streakUpdated: boolean;
  currentStreak: number;
  newAchievements: Achievement[];
};

/**
 * Award XP to the current user.
 */
export async function awardXPAction(
  amount: number,
  _reason: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { newXP: number; newLevel: number; leveledUp: boolean };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const result = await awardXP(user.id, amount);

    return { success: true, data: result };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error awarding XP:", err);

    return { success: false, error: "Failed to award XP." };
  }
}

/**
 * Check and award any new achievements for the current user.
 */
export async function checkAndAwardAchievements(): Promise<{
  success: boolean;
  error?: string;
  newAchievements?: Achievement[];
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const newAchievements = await checkAchievements(user.id);

    return { success: true, newAchievements };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error checking achievements:", err);

    return { success: false, error: "Failed to check achievements." };
  }
}

/**
 * Update the current user's streak.
 */
export async function updateStreakAction(): Promise<{
  success: boolean;
  error?: string;
  data?: { currentStreak: number; bestStreak: number; isNewDay: boolean };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const result = await updateStreak(user.id);

    return { success: true, data: result };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error updating streak:", err);

    return { success: false, error: "Failed to update streak." };
  }
}

/**
 * Get the current user's gamification status.
 */
export async function getGamificationStatus(): Promise<{
  success: boolean;
  error?: string;
  data?: GamificationStatus;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("xp_points, level, current_streak, best_streak")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found." };
    }

    // Count user's earned achievements
    const { count: achievementCount } = await supabase
      .from("user_achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Count total achievements available
    const { count: totalAchievements } = await supabase
      .from("achievements")
      .select("id", { count: "exact", head: true });

    return {
      success: true,
      data: {
        xp: (profile.xp_points as number) || 0,
        level: (profile.level as number) || 1,
        currentStreak: (profile.current_streak as number) || 0,
        bestStreak: (profile.best_streak as number) || 0,
        achievementCount: achievementCount || 0,
        totalAchievements: totalAchievements || 0,
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error getting gamification status:", err);

    return { success: false, error: "Failed to get gamification status." };
  }
}

/**
 * Get all achievements with the current user's unlock status.
 */
export async function getUserAchievements(): Promise<{
  success: boolean;
  error?: string;
  data?: AchievementWithStatus[];
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    // Get all achievements
    const { data: achievements, error: achError } = await supabase
      .from("achievements")
      .select("*")
      .order("category")
      .order("xp_reward");

    if (achError || !achievements) {
      return { success: false, error: "Failed to load achievements." };
    }

    // Get user's earned achievements
    const { data: earned } = await supabase
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("user_id", user.id);

    const earnedMap = new Map<string, string>();

    (earned || []).forEach(
      (ua: { achievement_id: string; earned_at: string }) => {
        earnedMap.set(ua.achievement_id, ua.earned_at);
      },
    );

    const result: AchievementWithStatus[] = achievements.map(
      (a: Achievement) => ({
        ...a,
        earned: earnedMap.has(a.id),
        earned_at: earnedMap.get(a.id) || null,
      }),
    );

    return { success: true, data: result };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error getting user achievements:", err);

    return { success: false, error: "Failed to get achievements." };
  }
}

/**
 * Convenience function that awards XP + updates streak + checks achievements
 * in one call. Used after logging entries.
 */
export async function processLogReward(
  logType: "blood_sugar" | "insulin" | "meal",
  hasImage?: boolean,
): Promise<LogRewardResult | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Determine XP amount
    let xpAmount: number;

    switch (logType) {
      case "blood_sugar":
        xpAmount = XP_REWARDS.BLOOD_SUGAR_LOG;
        break;
      case "insulin":
        xpAmount = XP_REWARDS.INSULIN_LOG;
        break;
      case "meal":
        xpAmount = hasImage
          ? XP_REWARDS.MEAL_LOG_WITH_IMAGE
          : XP_REWARDS.MEAL_LOG;
        break;
      default:
        xpAmount = 5;
    }

    // Award XP
    const xpResult = await awardXP(user.id, xpAmount);

    // Update streak
    const streakResult = await updateStreak(user.id);

    // Award streak bonus XP if it's a new day
    if (streakResult.isNewDay) {
      await awardXP(user.id, XP_REWARDS.STREAK_DAY);
    }

    // Check for new achievements
    const newAchievements = await checkAchievements(user.id);

    return {
      xpAwarded: xpAmount + (streakResult.isNewDay ? XP_REWARDS.STREAK_DAY : 0),
      newXP:
        xpResult.newXP + (streakResult.isNewDay ? XP_REWARDS.STREAK_DAY : 0),
      newLevel: xpResult.newLevel,
      leveledUp: xpResult.leveledUp,
      streakUpdated: streakResult.isNewDay,
      currentStreak: streakResult.currentStreak,
      newAchievements,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error processing log reward:", err);

    return null;
  }
}

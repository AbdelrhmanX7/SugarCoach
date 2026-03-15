import type { Achievement } from "@/types/database";

import { calculateLevel } from "./constants";

import { createClient } from "@/lib/supabase/server";

// Import pure utilities for local use

// Re-export pure utilities so existing server-side imports still work
export { XP_REWARDS, calculateLevel, xpForNextLevel } from "./constants";

/**
 * Award XP to a user. Updates their profile xp_points and recalculates level.
 */
export async function awardXP(
  userId: string,
  amount: number,
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const supabase = await createClient();

  // Get current profile
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("xp_points, level")
    .eq("user_id", userId)
    .single();

  if (fetchError || !profile) {
    throw new Error("Failed to fetch user profile for XP award");
  }

  const currentXP = (profile.xp_points as number) || 0;
  const currentLevel = (profile.level as number) || 1;
  const newXP = currentXP + amount;
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel > currentLevel;

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xp_points: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error("Failed to update XP: " + updateError.message);
  }

  return { newXP, newLevel, leveledUp };
}

/**
 * Update the user's streak. Checks last_activity_date and increments
 * or resets the streak accordingly.
 */
export async function updateStreak(
  userId: string,
): Promise<{ currentStreak: number; bestStreak: number; isNewDay: boolean }> {
  const supabase = await createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("current_streak, best_streak, last_activity_date")
    .eq("user_id", userId)
    .single();

  if (fetchError || !profile) {
    throw new Error("Failed to fetch user profile for streak update");
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const lastActivity = profile.last_activity_date as string | null;
  let currentStreak = (profile.current_streak as number) || 0;
  let bestStreak = (profile.best_streak as number) || 0;
  let isNewDay = false;

  if (!lastActivity) {
    // First ever activity
    currentStreak = 1;
    isNewDay = true;
  } else if (lastActivity === todayStr) {
    // Already logged today - no streak change
    isNewDay = false;
  } else {
    const lastDate = new Date(lastActivity);

    lastDate.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day - increment streak
      currentStreak += 1;
      isNewDay = true;
    } else {
      // Streak broken - reset to 1
      currentStreak = 1;
      isNewDay = true;
    }
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      current_streak: currentStreak,
      best_streak: bestStreak,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error("Failed to update streak: " + updateError.message);
  }

  return { currentStreak, bestStreak, isNewDay };
}

/**
 * Check all achievements for a user and award any newly unlocked ones.
 * Returns an array of newly unlocked achievements.
 */
export async function checkAchievements(
  userId: string,
): Promise<Achievement[]> {
  const supabase = await createClient();

  // Get all achievements
  const { data: allAchievements, error: achError } = await supabase
    .from("achievements")
    .select("*");

  if (achError || !allAchievements) {
    return [];
  }

  // Get user's already-earned achievement IDs
  const { data: earnedAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const earnedIds = new Set(
    (earnedAchievements || []).map(
      (ua: { achievement_id: string }) => ua.achievement_id,
    ),
  );

  // Get user profile for streak data
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, best_streak")
    .eq("user_id", userId)
    .single();

  // Count total logs (blood sugar + insulin + meals)
  const [bsCount, insulinCount, mealCount] = await Promise.all([
    supabase
      .from("blood_sugar_readings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("insulin_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("meal_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const totalLogs =
    (bsCount.count || 0) + (insulinCount.count || 0) + (mealCount.count || 0);

  // Count food photos (meals with image_url)
  const { count: photoCount } = await supabase
    .from("meal_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("image_url", "is", null);

  // Count CGM imports
  const { count: cgmCount } = await supabase
    .from("cgm_imports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  // Count diet plans
  const { count: dietPlanCount } = await supabase
    .from("diet_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Count meals today
  const todayStart = new Date();

  todayStart.setHours(0, 0, 0, 0);
  const { count: mealsToday } = await supabase
    .from("meal_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("meal_time", todayStart.toISOString());

  // Check for in-range day (all BG readings today within target)
  const { data: profileTarget } = await supabase
    .from("profiles")
    .select("target_bg_min, target_bg_max")
    .eq("user_id", userId)
    .single();

  const todayReadings = await supabase
    .from("blood_sugar_readings")
    .select("value")
    .eq("user_id", userId)
    .gte("reading_time", todayStart.toISOString());

  let fullDayInRange = false;

  if (todayReadings.data && todayReadings.data.length >= 3 && profileTarget) {
    const min = (profileTarget.target_bg_min as number) || 70;
    const max = (profileTarget.target_bg_max as number) || 180;

    fullDayInRange = todayReadings.data.every((r: { value: number }) => {
      return r.value >= min && r.value <= max;
    });
  }

  // Check for A1C improvement
  let a1cImproved = false;
  const { data: a1cRecords } = await supabase
    .from("a1c_records")
    .select("value")
    .eq("user_id", userId)
    .order("test_date", { ascending: false })
    .limit(2);

  if (a1cRecords && a1cRecords.length >= 2) {
    a1cImproved =
      (a1cRecords[0].value as number) < (a1cRecords[1].value as number);
  }

  const streak = profile
    ? Math.max(
        (profile.current_streak as number) || 0,
        (profile.best_streak as number) || 0,
      )
    : 0;

  // Evaluate each achievement
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) {
      continue;
    }

    const criteria = achievement.criteria as Record<string, unknown>;
    let earned = false;

    switch (criteria.type) {
      case "total_logs":
        earned = totalLogs >= (criteria.count as number);
        break;
      case "streak":
        earned = streak >= (criteria.days as number);
        break;
      case "food_photos":
        earned = (photoCount || 0) >= (criteria.count as number);
        break;
      case "cgm_import":
        earned = (cgmCount || 0) >= (criteria.count as number);
        break;
      case "diet_plan":
        earned = (dietPlanCount || 0) >= (criteria.count as number);
        break;
      case "daily_meals":
        earned = (mealsToday || 0) >= (criteria.count as number);
        break;
      case "full_day_in_range":
        earned = fullDayInRange;
        break;
      case "a1c_improved":
        earned = a1cImproved;
        break;
      default:
        break;
    }

    if (earned) {
      // Insert user_achievement record
      const { error: insertError } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

      if (!insertError) {
        newlyUnlocked.push(achievement as Achievement);

        // Award bonus XP for unlocking achievement
        try {
          await awardXP(userId, (achievement.xp_reward as number) || 0);
        } catch {
          // Non-critical: log but don't fail
          // eslint-disable-next-line no-console
          console.error(
            "Failed to award achievement XP for:",
            achievement.name,
          );
        }
      }
    }
  }

  return newlyUnlocked;
}

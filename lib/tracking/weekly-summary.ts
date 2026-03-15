"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateWeeklySummary(
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  // Get profile for target ranges
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_bg_min, target_bg_max")
    .eq("user_id", userId)
    .single();

  const targetMin = profile?.target_bg_min ?? 70;
  const targetMax = profile?.target_bg_max ?? 180;

  // Get readings for the week
  const { data: readings, error: readingsError } = await supabase
    .from("blood_sugar_readings")
    .select("*")
    .eq("user_id", userId)
    .gte("reading_time", weekStart)
    .lte("reading_time", weekEnd);

  if (readingsError) {
    return { success: false, error: readingsError.message };
  }

  // Get insulin logs
  const { data: insulinLogs } = await supabase
    .from("insulin_logs")
    .select("units")
    .eq("user_id", userId)
    .gte("injection_time", weekStart)
    .lte("injection_time", weekEnd);

  // Get meal logs
  const { data: mealLogs } = await supabase
    .from("meal_logs")
    .select("total_carbs")
    .eq("user_id", userId)
    .gte("meal_time", weekStart)
    .lte("meal_time", weekEnd);

  const readingsArr = readings ?? [];
  const insulinArr = insulinLogs ?? [];
  const mealsArr = mealLogs ?? [];

  // Calculate average blood sugar
  let avgBloodSugar: number | null = null;
  let timeInRangePct: number | null = null;
  let hypoCount = 0;
  let hyperCount = 0;
  let estimatedA1c: number | null = null;

  if (readingsArr.length > 0) {
    const sum = readingsArr.reduce((acc, r) => acc + r.value, 0);

    avgBloodSugar = Math.round((sum / readingsArr.length) * 10) / 10;

    const inRange = readingsArr.filter(
      (r) => r.value >= targetMin && r.value <= targetMax,
    ).length;

    timeInRangePct = Math.round((inRange / readingsArr.length) * 100 * 10) / 10;

    hypoCount = readingsArr.filter((r) => r.value < targetMin).length;
    hyperCount = readingsArr.filter((r) => r.value > targetMax).length;

    // eA1C = (avg_glucose + 46.7) / 28.7
    estimatedA1c = Math.round(((avgBloodSugar + 46.7) / 28.7) * 10) / 10;
  }

  // Total insulin
  const totalInsulinUnits =
    insulinArr.length > 0
      ? Math.round(insulinArr.reduce((acc, i) => acc + i.units, 0) * 10) / 10
      : null;

  // Average carbs per day
  const totalCarbs = mealsArr
    .filter((m) => m.total_carbs != null)
    .reduce((acc, m) => acc + (m.total_carbs ?? 0), 0);
  const avgCarbsPerDay =
    mealsArr.length > 0 ? Math.round(totalCarbs / 7) : null;

  const totalLogs = readingsArr.length + insulinArr.length + mealsArr.length;

  // Upsert into weekly_summaries
  const { error: upsertError } = await supabase.from("weekly_summaries").upsert(
    {
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      avg_blood_sugar: avgBloodSugar,
      time_in_range_pct: timeInRangePct,
      hypo_count: hypoCount,
      hyper_count: hyperCount,
      total_insulin_units: totalInsulinUnits,
      avg_carbs_per_day: avgCarbsPerDay,
      estimated_a1c: estimatedA1c,
      total_logs: totalLogs,
      xp_earned: 0,
    },
    {
      onConflict: "user_id,week_start",
    },
  );

  if (upsertError) {
    return { success: false, error: upsertError.message };
  }

  return { success: true };
}

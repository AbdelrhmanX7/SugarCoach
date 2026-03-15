"use server";

import type {
  BloodSugarReading,
  InsulinLog,
  MealLog,
  Profile,
} from "@/types/database";

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

import { getAuthenticatedUser } from "@/lib/actions/auth";

export async function getTodayReadings(): Promise<BloodSugarReading[]> {
  const { supabase, user } = await getAuthenticatedUser();
  const now = new Date();

  const { data, error } = await supabase
    .from("blood_sugar_readings")
    .select("*")
    .eq("user_id", user.id)
    .gte("reading_time", startOfDay(now).toISOString())
    .lte("reading_time", endOfDay(now).toISOString())
    .order("reading_time", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching today readings:", error);

    return [];
  }

  return data ?? [];
}

export async function getTodayInsulin(): Promise<InsulinLog[]> {
  const { supabase, user } = await getAuthenticatedUser();
  const now = new Date();

  const { data, error } = await supabase
    .from("insulin_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("injection_time", startOfDay(now).toISOString())
    .lte("injection_time", endOfDay(now).toISOString())
    .order("injection_time", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching today insulin:", error);

    return [];
  }

  return data ?? [];
}

export async function getTodayMeals(): Promise<MealLog[]> {
  const { supabase, user } = await getAuthenticatedUser();
  const now = new Date();

  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("meal_time", startOfDay(now).toISOString())
    .lte("meal_time", endOfDay(now).toISOString())
    .order("meal_time", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching today meals:", error);

    return [];
  }

  return data ?? [];
}

export async function getReadingsForRange(
  startDate: string,
  endDate: string,
): Promise<BloodSugarReading[]> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("blood_sugar_readings")
    .select("*")
    .eq("user_id", user.id)
    .gte("reading_time", startDate)
    .lte("reading_time", endDate)
    .order("reading_time", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching readings for range:", error);

    return [];
  }

  return data ?? [];
}

export async function getUserProfile(): Promise<Profile | null> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching profile:", error);

    return null;
  }

  return data;
}

export type WeeklyStats = {
  avgBG: number | null;
  timeInRangePct: number | null;
  hypoCount: number;
  hyperCount: number;
  totalInsulin: number | null;
  avgCarbs: number | null;
  totalReadings: number;
  totalLogs: number;
};

export async function getWeeklyStats(weekStart: string): Promise<WeeklyStats> {
  const { supabase, user } = await getAuthenticatedUser();

  const weekStartDate = new Date(weekStart);
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekEndStr = weekEndDate.toISOString();

  // Get profile for target ranges
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_bg_min, target_bg_max")
    .eq("user_id", user.id)
    .single();

  const targetMin = profile?.target_bg_min ?? 70;
  const targetMax = profile?.target_bg_max ?? 180;

  // Get readings for the week
  const { data: readings } = await supabase
    .from("blood_sugar_readings")
    .select("*")
    .eq("user_id", user.id)
    .gte("reading_time", weekStart)
    .lte("reading_time", weekEndStr)
    .order("reading_time", { ascending: true });

  // Get insulin logs for the week
  const { data: insulinLogs } = await supabase
    .from("insulin_logs")
    .select("units")
    .eq("user_id", user.id)
    .gte("injection_time", weekStart)
    .lte("injection_time", weekEndStr);

  // Get meal logs for the week
  const { data: mealLogs } = await supabase
    .from("meal_logs")
    .select("total_carbs")
    .eq("user_id", user.id)
    .gte("meal_time", weekStart)
    .lte("meal_time", weekEndStr);

  const readingsArr = readings ?? [];
  const insulinArr = insulinLogs ?? [];
  const mealsArr = mealLogs ?? [];

  // Calculate stats
  let avgBG: number | null = null;
  let timeInRangePct: number | null = null;
  let hypoCount = 0;
  let hyperCount = 0;

  if (readingsArr.length > 0) {
    const sum = readingsArr.reduce((acc, r) => acc + r.value, 0);

    avgBG = Math.round(sum / readingsArr.length);

    const inRange = readingsArr.filter(
      (r) => r.value >= targetMin && r.value <= targetMax,
    ).length;

    timeInRangePct = Math.round((inRange / readingsArr.length) * 100);

    hypoCount = readingsArr.filter((r) => r.value < targetMin).length;
    hyperCount = readingsArr.filter((r) => r.value > targetMax).length;
  }

  const totalInsulin =
    insulinArr.length > 0
      ? Math.round(insulinArr.reduce((acc, i) => acc + i.units, 0) * 10) / 10
      : null;

  const totalCarbs = mealsArr
    .filter((m) => m.total_carbs != null)
    .reduce((acc, m) => acc + (m.total_carbs ?? 0), 0);
  const daysWithMeals = 7;
  const avgCarbs =
    mealsArr.length > 0 ? Math.round(totalCarbs / daysWithMeals) : null;

  const totalLogs = readingsArr.length + insulinArr.length + mealsArr.length;

  return {
    avgBG,
    timeInRangePct,
    hypoCount,
    hyperCount,
    totalInsulin,
    avgCarbs,
    totalReadings: readingsArr.length,
    totalLogs,
  };
}

export type TrackingChartPoint = {
  time: string;
  value: number;
  label: string;
};

export type TrackingData = {
  chartPoints: TrackingChartPoint[];
  stats: WeeklyStats;
  targetMin: number;
  targetMax: number;
};

export async function getTrackingData(
  period: "day" | "week" | "month",
): Promise<TrackingData> {
  const { supabase, user } = await getAuthenticatedUser();

  const now = new Date();
  let rangeStart: Date;
  let rangeEnd: Date;

  switch (period) {
    case "day":
      rangeStart = startOfDay(now);
      rangeEnd = endOfDay(now);
      break;
    case "week":
      rangeStart = startOfWeek(now, { weekStartsOn: 1 });
      rangeEnd = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      rangeStart = startOfMonth(now);
      rangeEnd = endOfMonth(now);
      break;
  }

  // Get profile for targets
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_bg_min, target_bg_max")
    .eq("user_id", user.id)
    .single();

  const targetMin = profile?.target_bg_min ?? 70;
  const targetMax = profile?.target_bg_max ?? 180;

  // Get readings
  const { data: readings } = await supabase
    .from("blood_sugar_readings")
    .select("*")
    .eq("user_id", user.id)
    .gte("reading_time", rangeStart.toISOString())
    .lte("reading_time", rangeEnd.toISOString())
    .order("reading_time", { ascending: true });

  // Get insulin
  const { data: insulinLogs } = await supabase
    .from("insulin_logs")
    .select("units")
    .eq("user_id", user.id)
    .gte("injection_time", rangeStart.toISOString())
    .lte("injection_time", rangeEnd.toISOString());

  // Get meals
  const { data: mealLogs } = await supabase
    .from("meal_logs")
    .select("total_carbs")
    .eq("user_id", user.id)
    .gte("meal_time", rangeStart.toISOString())
    .lte("meal_time", rangeEnd.toISOString());

  const readingsArr = readings ?? [];
  const insulinArr = insulinLogs ?? [];
  const mealsArr = mealLogs ?? [];

  // Build chart points
  const chartPoints: TrackingChartPoint[] = readingsArr.map((r) => {
    const readingDate = new Date(r.reading_time);
    let label: string;

    switch (period) {
      case "day":
        label = format(readingDate, "HH:mm");
        break;
      case "week":
        label = format(readingDate, "EEE HH:mm");
        break;
      case "month":
        label = format(readingDate, "MMM dd");
        break;
    }

    return {
      time: r.reading_time,
      value: r.value,
      label,
    };
  });

  // Calculate stats
  let avgBG: number | null = null;
  let timeInRangePct: number | null = null;
  let hypoCount = 0;
  let hyperCount = 0;

  if (readingsArr.length > 0) {
    const sum = readingsArr.reduce((acc, r) => acc + r.value, 0);

    avgBG = Math.round(sum / readingsArr.length);

    const inRange = readingsArr.filter(
      (r) => r.value >= targetMin && r.value <= targetMax,
    ).length;

    timeInRangePct = Math.round((inRange / readingsArr.length) * 100);

    hypoCount = readingsArr.filter((r) => r.value < targetMin).length;
    hyperCount = readingsArr.filter((r) => r.value > targetMax).length;
  }

  const totalInsulin =
    insulinArr.length > 0
      ? Math.round(insulinArr.reduce((acc, i) => acc + i.units, 0) * 10) / 10
      : null;

  const totalCarbs = mealsArr
    .filter((m) => m.total_carbs != null)
    .reduce((acc, m) => acc + (m.total_carbs ?? 0), 0);
  const periodDays = period === "day" ? 1 : period === "week" ? 7 : 30;
  const avgCarbs =
    mealsArr.length > 0 ? Math.round(totalCarbs / periodDays) : null;

  const totalLogs = readingsArr.length + insulinArr.length + mealsArr.length;

  return {
    chartPoints,
    stats: {
      avgBG,
      timeInRangePct,
      hypoCount,
      hyperCount,
      totalInsulin,
      avgCarbs,
      totalReadings: readingsArr.length,
      totalLogs,
    },
    targetMin,
    targetMax,
  };
}

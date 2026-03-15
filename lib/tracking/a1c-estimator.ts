import { subDays } from "date-fns";

import { createClient } from "@/lib/supabase/server";

/**
 * Estimate A1C from average glucose using the ADAG formula.
 * eA1C = (avgGlucose + 46.7) / 28.7
 */
export function estimateA1C(avgGlucoseMgDl: number): number {
  return Math.round(((avgGlucoseMgDl + 46.7) / 28.7) * 10) / 10;
}

export type A1CEstimate = {
  estimatedA1C: number;
  avgGlucose: number;
  readingCount: number;
  confidence: "high" | "medium" | "low";
};

/**
 * Fetch blood glucose readings from the last 90 days for a user,
 * calculate the average, and estimate the A1C value.
 */
export async function getEstimatedA1CFromReadings(
  userId: string,
): Promise<A1CEstimate | null> {
  const supabase = await createClient();

  const ninetyDaysAgo = subDays(new Date(), 90).toISOString();

  const { data: readings, error } = await supabase
    .from("blood_sugar_readings")
    .select("value")
    .eq("user_id", userId)
    .gte("reading_time", ninetyDaysAgo)
    .order("reading_time", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching readings for A1C estimate:", error);

    return null;
  }

  if (!readings || readings.length === 0) {
    return null;
  }

  const sum = readings.reduce((acc, r) => acc + r.value, 0);
  const avgGlucose = Math.round((sum / readings.length) * 10) / 10;
  const estimatedA1C = estimateA1C(avgGlucose);
  const readingCount = readings.length;

  let confidence: "high" | "medium" | "low";

  if (readingCount > 200) {
    confidence = "high";
  } else if (readingCount > 50) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    estimatedA1C,
    avgGlucose,
    readingCount,
    confidence,
  };
}

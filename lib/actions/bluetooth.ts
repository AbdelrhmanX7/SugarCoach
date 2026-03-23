"use server";

import { createClient } from "@/lib/supabase/server";
import { processLogReward } from "@/lib/actions/gamification";

// Valid blood sugar ranges (matching lib/import/normalize.ts)
const VALID_RANGES = {
  "mg/dL": { min: 20, max: 600 },
  "mmol/L": { min: 1.1, max: 33.3 },
} as const;

type BleReadingInput = {
  value: number;
  unit: "mg/dL" | "mmol/L";
  timestamp: string;
};

type SaveBleResult = {
  success: boolean;
  saved: number;
  duplicates: number;
  error?: string;
};

function isValidReading(reading: unknown): reading is BleReadingInput {
  if (!reading || typeof reading !== "object") return false;

  const r = reading as Record<string, unknown>;

  if (typeof r.value !== "number" || isNaN(r.value)) return false;
  if (r.unit !== "mg/dL" && r.unit !== "mmol/L") return false;
  if (typeof r.timestamp !== "string") return false;

  const range = VALID_RANGES[r.unit as "mg/dL" | "mmol/L"];

  if (r.value < range.min || r.value > range.max) return false;

  const date = new Date(r.timestamp);

  if (isNaN(date.getTime())) return false;

  // Reject future dates (24h buffer for timezone)
  const futureLimit = new Date();

  futureLimit.setHours(futureLimit.getHours() + 24);

  return date <= futureLimit;
}

export async function saveBleReadings(
  readings: BleReadingInput[],
): Promise<SaveBleResult> {
  try {
    if (!Array.isArray(readings)) {
      return {
        success: false,
        saved: 0,
        duplicates: 0,
        error: "Invalid input",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, saved: 0, duplicates: 0, error: "Unauthorized" };
    }

    // Validate readings (also acts as runtime type guard)
    const validReadings = readings.filter(isValidReading);

    if (validReadings.length === 0) {
      return { success: true, saved: 0, duplicates: 0 };
    }

    // Find date range for dedup query
    const timestamps = validReadings.map((r) =>
      new Date(r.timestamp).getTime(),
    );
    const minTime = new Date(Math.min(...timestamps)).toISOString();
    const maxTime = new Date(Math.max(...timestamps)).toISOString();

    // Fetch existing readings in range for deduplication
    const { data: existing } = await supabase
      .from("blood_sugar_readings")
      .select("reading_time, value, unit")
      .eq("user_id", user.id)
      .eq("source", "accu_chek")
      .gte("reading_time", minTime)
      .lte("reading_time", maxTime);

    const existingKeys = new Set(
      (existing ?? []).map(
        (r: { reading_time: string; value: number; unit: string }) =>
          `${new Date(r.reading_time).toISOString()}|${r.value}|${r.unit}`,
      ),
    );

    // Filter out duplicates
    const newReadings = validReadings.filter(
      (r) => !existingKeys.has(`${r.timestamp}|${r.value}|${r.unit}`),
    );

    const duplicates = validReadings.length - newReadings.length;

    if (newReadings.length === 0) {
      return { success: true, saved: 0, duplicates };
    }

    // Batch insert (500 per batch, matching import pattern)
    const BATCH_SIZE = 500;

    for (let i = 0; i < newReadings.length; i += BATCH_SIZE) {
      const batch = newReadings.slice(i, i + BATCH_SIZE).map((r) => ({
        user_id: user.id,
        value: r.value,
        unit: r.unit,
        reading_time: r.timestamp,
        source: "accu_chek" as const,
        context: null,
        notes: null,
      }));

      const { error } = await supabase
        .from("blood_sugar_readings")
        .insert(batch);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error inserting BLE readings batch:", error);

        const sampleRow = JSON.stringify(batch[0]);

        return {
          success: false,
          saved: 0,
          duplicates,
          error: `DB insert failed: ${error.message} (code: ${error.code}, details: ${error.details}, hint: ${error.hint})\n\nSample row: ${sampleRow}`,
        };
      }
    }

    // Award gamification reward
    processLogReward("blood_sugar").catch(() => {});

    return { success: true, saved: newReadings.length, duplicates };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving BLE readings:", err);

    return {
      success: false,
      saved: 0,
      duplicates: 0,
      error: `Unexpected: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

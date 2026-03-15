export interface NormalizedReading {
  value: number;
  unit: "mg/dL" | "mmol/L";
  timestamp: string; // ISO string
  source: "libre" | "dexcom" | "mysugr";
}

export interface MySugrExtraData {
  timestamp: string;
  insulinMeal: number | null;
  insulinCorrection: number | null;
  mealCarbs: number | null;
}

// Valid blood sugar ranges
const VALID_RANGES = {
  "mg/dL": { min: 20, max: 600 },
  "mmol/L": { min: 1.1, max: 33.3 },
} as const;

function isValidReading(reading: NormalizedReading): boolean {
  const range = VALID_RANGES[reading.unit];

  if (reading.value < range.min || reading.value > range.max) {
    return false;
  }

  // Validate timestamp is a valid date
  const date = new Date(reading.timestamp);

  if (isNaN(date.getTime())) {
    return false;
  }

  // Reject future dates (allow a small buffer for timezone differences)
  const now = new Date();

  now.setHours(now.getHours() + 24);
  if (date > now) {
    return false;
  }

  return true;
}

export function normalizeReadings(
  readings: NormalizedReading[],
): NormalizedReading[] {
  // Filter out invalid readings
  const valid = readings.filter(isValidReading);

  // Sort by timestamp ascending
  valid.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Remove duplicates (same timestamp + value)
  const seen = new Set<string>();
  const deduplicated: NormalizedReading[] = [];

  for (const reading of valid) {
    const key = `${reading.timestamp}|${reading.value}|${reading.unit}`;

    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(reading);
    }
  }

  return deduplicated;
}

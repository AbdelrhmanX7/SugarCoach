import Papa from "papaparse";

import { NormalizedReading } from "./normalize";

// Dexcom CSV format:
// May have metadata rows at top
// Key columns: "Timestamp (YYYY-MM-DDThh:mm:ss)", "Event Type", "Glucose Value (mg/dL)"
// Event Type "EGV" = estimated glucose value

function findHeaderRowIndex(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();

    if (
      (line.includes("timestamp") && line.includes("event type")) ||
      (line.includes("glucose value") && line.includes("event type"))
    ) {
      return i;
    }
  }

  return -1;
}

function findColumnIndex(headers: string[], ...patterns: string[]): number {
  for (const pattern of patterns) {
    const idx = headers.findIndex((h) =>
      h.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (idx !== -1) return idx;
  }

  return -1;
}

function parseDexcomTimestamp(raw: string): string | null {
  if (!raw || raw.trim() === "") return null;

  const trimmed = raw.trim();

  // Try ISO format directly
  const isoDate = new Date(trimmed);

  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }

  // Dexcom format: YYYY-MM-DDThh:mm:ss
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );

  if (match) {
    const [, year, month, day, hour, minute, second] = match;

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
    ).toISOString();
  }

  // Also try MM/DD/YYYY HH:MM:SS AM/PM format used in some Dexcom exports
  const usMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?$/i,
  );

  if (usMatch) {
    const [, month, day, year, hour, minute, second, ampm] = usMatch;
    let h = parseInt(hour);

    if (ampm) {
      if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
      if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
    }

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      h,
      parseInt(minute),
      parseInt(second || "0"),
    ).toISOString();
  }

  return null;
}

function detectUnit(headers: string[]): "mg/dL" | "mmol/L" {
  for (const h of headers) {
    if (h.toLowerCase().includes("mmol/l")) return "mmol/L";
    if (h.toLowerCase().includes("mg/dl")) return "mg/dL";
  }

  return "mg/dL";
}

export function parseDexcomCSV(csvContent: string): NormalizedReading[] {
  const lines = csvContent.split("\n").map((l) => l.trim());
  const headerRowIdx = findHeaderRowIndex(lines);

  if (headerRowIdx === -1) {
    throw new Error(
      "Could not find header row in Dexcom CSV. Expected columns like 'Timestamp', 'Event Type', 'Glucose Value'.",
    );
  }

  const dataContent = lines.slice(headerRowIdx).join("\n");
  const parsed = Papa.parse<string[]>(dataContent, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV parsing failed: ${parsed.errors[0]?.message}`);
  }

  const headers = parsed.data[0];

  if (!headers || headers.length === 0) {
    throw new Error("No headers found in Dexcom CSV.");
  }

  const unit = detectUnit(headers);

  const timestampIdx = findColumnIndex(
    headers,
    "timestamp (yyyy-mm-ddthh:mm:ss)",
    "timestamp",
  );
  const eventTypeIdx = findColumnIndex(headers, "event type");
  const glucoseIdx = findColumnIndex(
    headers,
    "glucose value (mg/dl)",
    "glucose value (mmol/l)",
    "glucose value",
  );

  if (timestampIdx === -1) {
    throw new Error("Could not find timestamp column in Dexcom CSV.");
  }

  if (glucoseIdx === -1) {
    throw new Error("Could not find glucose value column in Dexcom CSV.");
  }

  const readings: NormalizedReading[] = [];

  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];

    if (!row || row.length <= Math.max(timestampIdx, glucoseIdx)) continue;

    // Filter to EGV (Estimated Glucose Value) events if event type column exists
    if (eventTypeIdx !== -1) {
      const eventType = row[eventTypeIdx]?.trim().toUpperCase();

      if (eventType !== "EGV") continue;
    }

    const rawGlucose = row[glucoseIdx]?.trim();

    if (!rawGlucose || rawGlucose === "") continue;

    // Dexcom sometimes uses "Low" or "High" instead of numbers
    if (
      rawGlucose.toLowerCase() === "low" ||
      rawGlucose.toLowerCase() === "high"
    ) {
      continue;
    }

    const glucoseValue = parseFloat(rawGlucose);

    if (isNaN(glucoseValue)) continue;

    const timestamp = parseDexcomTimestamp(row[timestampIdx]);

    if (!timestamp) continue;

    readings.push({
      value: glucoseValue,
      unit,
      timestamp,
      source: "dexcom",
    });
  }

  return readings;
}

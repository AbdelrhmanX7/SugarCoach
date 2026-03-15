import Papa from "papaparse";

import { NormalizedReading } from "./normalize";

// FreeStyle Libre CSV columns vary by version, but common patterns:
// "Device Timestamp" or "Timestamp"
// "Record Type" — 0 = historic glucose (every 15 min), 1 = scan glucose
// "Historic Glucose mg/dL" or "Historic Glucose mmol/L"
// "Scan Glucose mg/dL" or "Scan Glucose mmol/L"

function findHeaderRowIndex(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();

    if (
      line.includes("device timestamp") ||
      line.includes("record type") ||
      (line.includes("timestamp") && line.includes("glucose"))
    ) {
      return i;
    }
  }

  return -1;
}

function detectUnit(headers: string[]): "mg/dL" | "mmol/L" {
  for (const h of headers) {
    if (h.toLowerCase().includes("mmol/l")) return "mmol/L";
    if (h.toLowerCase().includes("mg/dl")) return "mg/dL";
  }

  return "mg/dL"; // default
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

function parseLibreTimestamp(raw: string): string | null {
  if (!raw || raw.trim() === "") return null;

  const trimmed = raw.trim();

  // Try ISO format first
  const isoDate = new Date(trimmed);

  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }

  // Libre often uses DD-MM-YYYY HH:MM or MM-DD-YYYY HH:MM or similar
  // Try common formats
  const formats = [
    // DD-MM-YYYY HH:MM
    /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/,
    // DD/MM/YYYY HH:MM
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/,
    // YYYY-MM-DD HH:MM
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/,
    // MM/DD/YYYY HH:MM:SS AM/PM
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?$/i,
  ];

  // DD-MM-YYYY HH:MM
  let match = trimmed.match(formats[0]);

  if (match) {
    const [, day, month, year, hour, minute] = match;

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
    ).toISOString();
  }

  // DD/MM/YYYY HH:MM
  match = trimmed.match(formats[1]);
  if (match) {
    const [, day, month, year, hour, minute] = match;

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
    ).toISOString();
  }

  // YYYY-MM-DD HH:MM
  match = trimmed.match(formats[2]);
  if (match) {
    const [, year, month, day, hour, minute] = match;

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
    ).toISOString();
  }

  // MM/DD/YYYY HH:MM:SS AM/PM
  match = trimmed.match(formats[3]);
  if (match) {
    const [, month, day, year, hour, minute, second, ampm] = match;
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

export function parseLibreCSV(csvContent: string): NormalizedReading[] {
  const lines = csvContent.split("\n").map((l) => l.trim());
  const headerRowIdx = findHeaderRowIndex(lines);

  if (headerRowIdx === -1) {
    throw new Error(
      "Could not find header row in Libre CSV. Expected columns like 'Device Timestamp', 'Record Type', 'Historic Glucose'.",
    );
  }

  // Parse only from header row onward
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
    throw new Error("No headers found in Libre CSV.");
  }

  const unit = detectUnit(headers);

  // Find relevant column indices
  const timestampIdx = findColumnIndex(
    headers,
    "device timestamp",
    "timestamp",
  );
  const recordTypeIdx = findColumnIndex(headers, "record type");
  const historicGlucoseIdx = findColumnIndex(
    headers,
    "historic glucose mg/dl",
    "historic glucose mmol/l",
    "historic glucose",
  );
  const scanGlucoseIdx = findColumnIndex(
    headers,
    "scan glucose mg/dl",
    "scan glucose mmol/l",
    "scan glucose",
  );

  if (timestampIdx === -1) {
    throw new Error("Could not find timestamp column in Libre CSV.");
  }

  const readings: NormalizedReading[] = [];

  // Process data rows (skip header)
  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];

    if (!row || row.length <= timestampIdx) continue;

    const recordType = recordTypeIdx !== -1 ? row[recordTypeIdx]?.trim() : null;

    // Get glucose value based on record type
    let glucoseValue: number | null = null;

    if (recordType === "0" && historicGlucoseIdx !== -1) {
      // Historic glucose (automatic every 15 min)
      const rawVal = row[historicGlucoseIdx]?.trim();

      if (rawVal && rawVal !== "") {
        glucoseValue = parseFloat(rawVal);
      }
    } else if (recordType === "1" && scanGlucoseIdx !== -1) {
      // Scan glucose (manual scan)
      const rawVal = row[scanGlucoseIdx]?.trim();

      if (rawVal && rawVal !== "") {
        glucoseValue = parseFloat(rawVal);
      }
    } else if (recordTypeIdx === -1) {
      // No record type column — try historic first, then scan
      if (historicGlucoseIdx !== -1) {
        const rawVal = row[historicGlucoseIdx]?.trim();

        if (rawVal && rawVal !== "") {
          glucoseValue = parseFloat(rawVal);
        }
      }
      if (glucoseValue === null && scanGlucoseIdx !== -1) {
        const rawVal = row[scanGlucoseIdx]?.trim();

        if (rawVal && rawVal !== "") {
          glucoseValue = parseFloat(rawVal);
        }
      }
    }

    if (glucoseValue === null || isNaN(glucoseValue)) continue;

    const timestamp = parseLibreTimestamp(row[timestampIdx]);

    if (!timestamp) continue;

    readings.push({
      value: glucoseValue,
      unit,
      timestamp,
      source: "libre",
    });
  }

  return readings;
}

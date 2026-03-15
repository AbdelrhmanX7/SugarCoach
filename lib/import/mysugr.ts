import Papa from "papaparse";
import * as XLSX from "xlsx";

import { MySugrExtraData, NormalizedReading } from "./normalize";

// MySugr format:
// Columns: "Date", "Time", "Blood Sugar Measurement"
// May also contain: "Insulin (Meal)", "Insulin (Correction)", "Meal (Carbs)"

export interface MySugrParseResult {
  readings: NormalizedReading[];
  extraData: MySugrExtraData[];
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

function parseMySugrTimestamp(date: string, time: string): string | null {
  if (!date || date.trim() === "") return null;

  const dateTrimmed = date.trim();
  const timeTrimmed = (time || "00:00").trim();

  // Common date formats from MySugr
  // YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY
  let year: number, month: number, day: number;

  // YYYY-MM-DD
  let match = dateTrimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    year = parseInt(match[1]);
    month = parseInt(match[2]) - 1;
    day = parseInt(match[3]);
  } else {
    // DD/MM/YYYY or DD.MM.YYYY
    match = dateTrimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (match) {
      day = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      year = parseInt(match[3]);
    } else {
      // MM/DD/YYYY (US format)
      match = dateTrimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        month = parseInt(match[1]) - 1;
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else {
        // Try native Date parse as fallback
        const parsed = new Date(dateTrimmed);

        if (isNaN(parsed.getTime())) return null;
        year = parsed.getFullYear();
        month = parsed.getMonth();
        day = parsed.getDate();
      }
    }
  }

  // Parse time: HH:MM or HH:MM:SS or h:MM AM/PM
  let hours = 0,
    minutes = 0,
    seconds = 0;

  const timeMatch = timeTrimmed.match(
    /^(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?$/i,
  );

  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = parseInt(timeMatch[2]);
    seconds = parseInt(timeMatch[3] || "0");

    const ampm = timeMatch[4];

    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
  }

  const result = new Date(year, month, day, hours, minutes, seconds);

  if (isNaN(result.getTime())) return null;

  return result.toISOString();
}

function parseRows(headers: string[], rows: string[][]): MySugrParseResult {
  const dateIdx = findColumnIndex(headers, "date");
  const timeIdx = findColumnIndex(headers, "time");
  const bsIdx = findColumnIndex(
    headers,
    "blood sugar measurement",
    "blood sugar",
    "glucose",
  );
  const insulinMealIdx = findColumnIndex(
    headers,
    "insulin (meal)",
    "insulin meal",
    "bolus",
  );
  const insulinCorrectionIdx = findColumnIndex(
    headers,
    "insulin (correction)",
    "insulin correction",
    "correction",
  );
  const carbsIdx = findColumnIndex(
    headers,
    "meal (carbs)",
    "carbs",
    "carbohydrates",
  );

  if (dateIdx === -1) {
    throw new Error("Could not find 'Date' column in MySugr data.");
  }

  const readings: NormalizedReading[] = [];
  const extraData: MySugrExtraData[] = [];

  for (const row of rows) {
    if (!row || row.length <= dateIdx) continue;

    const dateVal = row[dateIdx]?.trim();

    if (!dateVal || dateVal === "") continue;

    const timeVal = timeIdx !== -1 ? row[timeIdx]?.trim() || "00:00" : "00:00";
    const timestamp = parseMySugrTimestamp(dateVal, timeVal);

    if (!timestamp) continue;

    // Blood sugar reading
    if (bsIdx !== -1) {
      const rawBS = row[bsIdx]?.trim();

      if (rawBS && rawBS !== "") {
        const value = parseFloat(rawBS);

        if (!isNaN(value)) {
          // MySugr typically exports in mg/dL but can be mmol/L
          // Heuristic: if value < 40, it's likely mmol/L
          const unit: "mg/dL" | "mmol/L" = value < 40 ? "mmol/L" : "mg/dL";

          readings.push({
            value,
            unit,
            timestamp,
            source: "mysugr",
          });
        }
      }
    }

    // Extra data (insulin, carbs)
    const insulinMeal =
      insulinMealIdx !== -1
        ? parseFloat(row[insulinMealIdx]?.trim() || "")
        : null;
    const insulinCorrection =
      insulinCorrectionIdx !== -1
        ? parseFloat(row[insulinCorrectionIdx]?.trim() || "")
        : null;
    const mealCarbs =
      carbsIdx !== -1 ? parseFloat(row[carbsIdx]?.trim() || "") : null;

    const hasExtra =
      (insulinMeal !== null && !isNaN(insulinMeal)) ||
      (insulinCorrection !== null && !isNaN(insulinCorrection)) ||
      (mealCarbs !== null && !isNaN(mealCarbs));

    if (hasExtra) {
      extraData.push({
        timestamp,
        insulinMeal:
          insulinMeal !== null && !isNaN(insulinMeal) ? insulinMeal : null,
        insulinCorrection:
          insulinCorrection !== null && !isNaN(insulinCorrection)
            ? insulinCorrection
            : null,
        mealCarbs: mealCarbs !== null && !isNaN(mealCarbs) ? mealCarbs : null,
      });
    }
  }

  return { readings, extraData };
}

export function parseMySugrCSV(csvContent: string): MySugrParseResult {
  const parsed = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV parsing failed: ${parsed.errors[0]?.message}`);
  }

  if (parsed.data.length < 2) {
    throw new Error("MySugr CSV contains no data rows.");
  }

  const headers = parsed.data[0];
  const rows = parsed.data.slice(1);

  return parseRows(headers, rows);
}

export function parseMySugrExcel(buffer: ArrayBuffer): MySugrParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel file contains no sheets.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  if (jsonData.length < 2) {
    throw new Error("MySugr Excel file contains no data rows.");
  }

  const headers = jsonData[0];
  const rows = jsonData.slice(1);

  return parseRows(headers, rows);
}

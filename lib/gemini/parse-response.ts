import type {
  BloodSugarReading,
  InsulinLog,
  MealLog,
  MealItem,
} from "@/types/database";

/**
 * Extract JSON blocks from Gemini response text.
 * Looks for ```json ... ``` code fences first, then falls back to raw JSON objects.
 */
export function extractStructuredData(text: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];

  // Try to find ```json ... ``` code fences
  const jsonFenceRegex = /```json\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  match = jsonFenceRegex.exec(text);
  while (match !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "object" && item !== null) {
            results.push(item as Record<string, unknown>);
          }
        }
      } else if (typeof parsed === "object" && parsed !== null) {
        results.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Skip invalid JSON blocks
    }
    match = jsonFenceRegex.exec(text);
  }

  if (results.length > 0) {
    return results;
  }

  // Fallback: try to find raw JSON objects in the text
  const jsonObjectRegex = /\{[\s\S]*?\}(?=\s*(?:\{|$))/g;

  match = jsonObjectRegex.exec(text);
  while (match !== null) {
    try {
      const parsed = JSON.parse(match[0]);

      if (typeof parsed === "object" && parsed !== null) {
        results.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Skip invalid JSON
    }
    match = jsonObjectRegex.exec(text);
  }

  return results;
}

/**
 * Parse a blood sugar reading from structured data.
 * Returns null if required fields are missing or invalid.
 */
export function parseBloodSugar(
  data: Record<string, unknown>,
): Partial<BloodSugarReading> | null {
  if (data.type !== "blood_sugar") return null;

  const value = Number(data.value);

  if (isNaN(value) || value <= 0) return null;

  const validUnits = ["mg/dL", "mmol/L"] as const;
  const unit =
    typeof data.unit === "string" &&
    validUnits.includes(data.unit as (typeof validUnits)[number])
      ? (data.unit as "mg/dL" | "mmol/L")
      : "mg/dL";

  const validContexts = [
    "fasting",
    "before_meal",
    "after_meal",
    "bedtime",
    "other",
  ] as const;
  const context =
    typeof data.context === "string" &&
    validContexts.includes(data.context as (typeof validContexts)[number])
      ? (data.context as (typeof validContexts)[number])
      : null;

  const result: Partial<BloodSugarReading> = {
    value,
    unit,
    context,
    source: "ai_chat" as const,
  };

  if (typeof data.time === "string") {
    result.reading_time = data.time;
  }

  return result;
}

/**
 * Parse an insulin log from structured data.
 * Returns null if required fields are missing or invalid.
 */
export function parseInsulin(
  data: Record<string, unknown>,
): Partial<InsulinLog> | null {
  if (data.type !== "insulin") return null;

  const units = Number(data.units);

  if (isNaN(units) || units <= 0) return null;

  const validTypes = [
    "rapid",
    "short",
    "intermediate",
    "long",
    "mixed",
  ] as const;
  const insulinType =
    typeof data.insulin_type === "string" &&
    validTypes.includes(data.insulin_type as (typeof validTypes)[number])
      ? (data.insulin_type as (typeof validTypes)[number])
      : "rapid";

  const validMethods = ["syringe", "pen"] as const;
  const method =
    typeof data.method === "string" &&
    validMethods.includes(data.method as (typeof validMethods)[number])
      ? (data.method as (typeof validMethods)[number])
      : "syringe";

  const result: Partial<InsulinLog> = {
    units,
    insulin_type: insulinType,
    method,
  };

  if (typeof data.brand === "string") {
    result.insulin_brand = data.brand;
  }

  if (typeof data.time === "string") {
    result.injection_time = data.time;
  }

  return result;
}

/**
 * Parse a meal log and its items from structured data.
 * Returns null if required fields are missing or invalid.
 */
export function parseMeal(
  data: Record<string, unknown>,
): { meal: Partial<MealLog>; items: Partial<MealItem>[] } | null {
  if (data.type !== "meal") return null;

  const validMealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  const mealType =
    typeof data.meal_type === "string" &&
    validMealTypes.includes(data.meal_type as (typeof validMealTypes)[number])
      ? (data.meal_type as (typeof validMealTypes)[number])
      : null;

  const meal: Partial<MealLog> = {
    meal_type: mealType,
    ai_analyzed: true,
  };

  if (typeof data.description === "string") {
    meal.description = data.description;
  }

  if (typeof data.time === "string") {
    meal.meal_time = data.time;
  }

  const items: Partial<MealItem>[] = [];

  if (Array.isArray(data.items)) {
    let totalCarbs = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalSugar = 0;
    let totalFiber = 0;

    for (const item of data.items) {
      if (typeof item !== "object" || item === null) continue;

      const itemData = item as Record<string, unknown>;
      const name = typeof itemData.name === "string" ? itemData.name : null;

      if (!name) continue;

      const mealItem: Partial<MealItem> = { name };

      if (itemData.quantity !== undefined) {
        const qty = Number(itemData.quantity);

        if (!isNaN(qty)) mealItem.quantity = qty;
      }

      if (typeof itemData.unit === "string") {
        mealItem.unit = itemData.unit;
      }

      const estimatedCarbs = Number(itemData.estimated_carbs ?? itemData.carbs);

      if (!isNaN(estimatedCarbs)) {
        mealItem.carbs = estimatedCarbs;
        totalCarbs += estimatedCarbs;
      }

      const calories = Number(itemData.calories);

      if (!isNaN(calories)) {
        mealItem.calories = calories;
        totalCalories += calories;
      }

      const protein = Number(itemData.protein);

      if (!isNaN(protein)) {
        mealItem.protein = protein;
        totalProtein += protein;
      }

      const fat = Number(itemData.fat);

      if (!isNaN(fat)) {
        mealItem.fat = fat;
        totalFat += fat;
      }

      const sugar = Number(itemData.sugar);

      if (!isNaN(sugar)) {
        mealItem.sugar = sugar;
        totalSugar += sugar;
      }

      const fiber = Number(itemData.fiber);

      if (!isNaN(fiber)) {
        mealItem.fiber = fiber;
        totalFiber += fiber;
      }

      items.push(mealItem);
    }

    if (totalCarbs > 0) meal.total_carbs = totalCarbs;
    if (totalCalories > 0) meal.total_calories = totalCalories;
    if (totalProtein > 0) meal.total_protein = totalProtein;
    if (totalFat > 0) meal.total_fat = totalFat;
    if (totalSugar > 0) meal.total_sugar = totalSugar;
    if (totalFiber > 0) meal.total_fiber = totalFiber;
  }

  return { meal, items };
}

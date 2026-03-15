"use server";

import { createClient } from "@/lib/supabase/server";
import { processLogReward } from "@/lib/actions/gamification";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

export async function saveBloodSugar(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to save a reading.",
      };
    }

    const value = parseFloat(formData.get("value") as string);
    const unit = formData.get("unit") as string;
    const context = formData.get("context") as string;
    const readingTime = formData.get("reading_time") as string;
    const notes = (formData.get("notes") as string) || null;

    if (!value || value <= 0) {
      return {
        success: false,
        error: "Please enter a valid blood sugar value.",
      };
    }

    if (!unit || !["mg/dL", "mmol/L"].includes(unit)) {
      return { success: false, error: "Please select a valid unit." };
    }

    const { data, error } = await supabase
      .from("blood_sugar_readings")
      .insert({
        user_id: user.id,
        value,
        unit,
        context: context || null,
        reading_time: readingTime || new Date().toISOString(),
        source: "manual",
        notes,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving blood sugar:", error);

      return {
        success: false,
        error: "Failed to save reading. Please try again.",
      };
    }

    // Award gamification rewards
    processLogReward("blood_sugar").catch(() => {});

    return { success: true, data: data as unknown as Record<string, unknown> };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving blood sugar:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveInsulin(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to save an insulin log.",
      };
    }

    const units = parseFloat(formData.get("units") as string);
    const insulinType = formData.get("insulin_type") as string;
    const insulinBrand = (formData.get("insulin_brand") as string) || null;
    const method = formData.get("method") as string;
    const injectionTime = formData.get("injection_time") as string;
    const notes = (formData.get("notes") as string) || null;

    if (!units || units <= 0) {
      return { success: false, error: "Please enter a valid number of units." };
    }

    if (!insulinType) {
      return { success: false, error: "Please select an insulin type." };
    }

    const { data, error } = await supabase
      .from("insulin_logs")
      .insert({
        user_id: user.id,
        units,
        insulin_type: insulinType,
        insulin_brand: insulinBrand,
        method: method || "pen",
        injection_time: injectionTime || new Date().toISOString(),
        notes,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving insulin log:", error);

      return {
        success: false,
        error: "Failed to save insulin log. Please try again.",
      };
    }

    // Award gamification rewards
    processLogReward("insulin").catch(() => {});

    return { success: true, data: data as unknown as Record<string, unknown> };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving insulin:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveMeal(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in to save a meal." };
    }

    const mealType = formData.get("meal_type") as string;
    const description = (formData.get("description") as string) || null;
    const mealTime = formData.get("meal_time") as string;
    const notes = (formData.get("notes") as string) || null;
    const aiAnalyzed = formData.get("ai_analyzed") === "true";
    const imageUrl = (formData.get("image_url") as string) || null;

    const totalCarbs = formData.get("total_carbs")
      ? parseFloat(formData.get("total_carbs") as string)
      : null;
    const totalCalories = formData.get("total_calories")
      ? parseFloat(formData.get("total_calories") as string)
      : null;
    const totalProtein = formData.get("total_protein")
      ? parseFloat(formData.get("total_protein") as string)
      : null;
    const totalFat = formData.get("total_fat")
      ? parseFloat(formData.get("total_fat") as string)
      : null;
    const totalSugar = formData.get("total_sugar")
      ? parseFloat(formData.get("total_sugar") as string)
      : null;
    const totalFiber = formData.get("total_fiber")
      ? parseFloat(formData.get("total_fiber") as string)
      : null;
    const recommendedInsulin = formData.get("recommended_insulin")
      ? parseFloat(formData.get("recommended_insulin") as string)
      : null;

    if (!mealType) {
      return { success: false, error: "Please select a meal type." };
    }

    const { data, error } = await supabase
      .from("meal_logs")
      .insert({
        user_id: user.id,
        meal_type: mealType,
        description,
        total_carbs: totalCarbs,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_fat: totalFat,
        total_sugar: totalSugar,
        total_fiber: totalFiber,
        image_url: imageUrl,
        meal_time: mealTime || new Date().toISOString(),
        ai_analyzed: aiAnalyzed,
        recommended_insulin: recommendedInsulin,
        notes,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving meal:", error);

      return {
        success: false,
        error: "Failed to save meal. Please try again.",
      };
    }

    // Award gamification rewards (with image bonus if applicable)
    const hasImage = !!imageUrl;

    processLogReward("meal", hasImage).catch(() => {});

    return { success: true, data: data as unknown as Record<string, unknown> };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving meal:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

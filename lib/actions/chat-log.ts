"use server";

import { createClient } from "@/lib/supabase/server";
import { processLogReward } from "@/lib/actions/gamification";

export type ChatActionResult = {
  data?: Record<string, unknown>;
  error?: string;
  success: boolean;
};

/**
 * Save a blood sugar reading from chat structured data.
 * Uses typed params instead of FormData for chat-based saves.
 */
export async function saveChatBloodSugar(params: {
  context?: string | null;
  notes?: string | null;
  reading_time?: string;
  unit?: string;
  value: number;
}): Promise<ChatActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const { data, error } = await supabase
      .from("blood_sugar_readings")
      .insert({
        user_id: user.id,
        value: params.value,
        unit: params.unit || "mg/dL",
        context: params.context || null,
        reading_time: params.reading_time || new Date().toISOString(),
        source: "ai_chat",
        notes: params.notes || null,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving blood sugar from chat:", error);

      return { success: false, error: "Failed to save reading." };
    }

    // Award gamification rewards
    processLogReward("blood_sugar").catch(() => {});

    return { success: true, data: data as unknown as Record<string, unknown> };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving blood sugar:", err);

    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Save an insulin log from chat structured data.
 */
export async function saveChatInsulin(params: {
  injection_time?: string;
  insulin_brand?: string | null;
  insulin_type?: string;
  meal_log_id?: string | null;
  method?: string;
  notes?: string | null;
  units: number;
}): Promise<ChatActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const { data, error } = await supabase
      .from("insulin_logs")
      .insert({
        user_id: user.id,
        units: params.units,
        insulin_type: params.insulin_type || "rapid",
        insulin_brand: params.insulin_brand || null,
        method: params.method || "pen",
        injection_time: params.injection_time || new Date().toISOString(),
        meal_log_id: params.meal_log_id || null,
        notes: params.notes || null,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving insulin from chat:", error);

      return { success: false, error: "Failed to save insulin log." };
    }

    // Award gamification rewards
    processLogReward("insulin").catch(() => {});

    return { success: true, data: data as unknown as Record<string, unknown> };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving insulin:", err);

    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Save a meal log (with optional items) from chat structured data.
 */
export async function saveChatMeal(params: {
  description?: string | null;
  image_url?: string | null;
  items?: Array<{
    calories?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
    name: string;
    protein?: number | null;
    quantity?: number | null;
    sugar?: number | null;
    unit?: string | null;
  }>;
  meal_time?: string;
  meal_type?: string | null;
  notes?: string | null;
  recommended_insulin?: number | null;
  total_calories?: number | null;
  total_carbs?: number | null;
  total_fat?: number | null;
  total_fiber?: number | null;
  total_protein?: number | null;
  total_sugar?: number | null;
}): Promise<ChatActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be logged in." };
    }

    const { data: mealRow, error: mealError } = await supabase
      .from("meal_logs")
      .insert({
        user_id: user.id,
        meal_type: params.meal_type || null,
        description: params.description || null,
        total_carbs: params.total_carbs || null,
        total_calories: params.total_calories || null,
        total_protein: params.total_protein || null,
        total_fat: params.total_fat || null,
        total_sugar: params.total_sugar || null,
        total_fiber: params.total_fiber || null,
        image_url: params.image_url || null,
        meal_time: params.meal_time || new Date().toISOString(),
        ai_analyzed: true,
        recommended_insulin: params.recommended_insulin || null,
        notes: params.notes || null,
      })
      .select()
      .single();

    if (mealError) {
      // eslint-disable-next-line no-console
      console.error("Error saving meal from chat:", mealError);

      return { success: false, error: "Failed to save meal." };
    }

    const meal = mealRow as Record<string, unknown>;

    if (params.items && params.items.length > 0) {
      const mealItems = params.items.map((item) => ({
        meal_log_id: meal.id as string,
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        carbs: item.carbs || null,
        calories: item.calories || null,
        protein: item.protein || null,
        fat: item.fat || null,
        sugar: item.sugar || null,
        fiber: item.fiber || null,
      }));

      const { error: itemsError } = await supabase
        .from("meal_items")
        .insert(mealItems);

      if (itemsError) {
        // eslint-disable-next-line no-console
        console.error("Error saving meal items:", itemsError);
      }
    }

    // Award gamification rewards (with image bonus if applicable)
    const hasImage = !!params.image_url;

    processLogReward("meal", hasImage).catch(() => {});

    return { success: true, data: meal };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving meal:", err);

    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Mark a chat message's structured data as saved.
 */
export async function markChatDataSaved(
  messageId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("chat_messages")
    .update({ data_saved: true })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

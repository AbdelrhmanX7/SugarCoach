"use server";

import type { PantryItem } from "@/types/database";

import { createClient } from "@/lib/supabase/server";
import { getFlashModel } from "@/lib/gemini/client";

export type PantryActionResult = {
  success: boolean;
  error?: string;
  data?: PantryItem | PantryItem[];
};

export type MealSuggestionResult = {
  success: boolean;
  error?: string;
  suggestions?: string;
};

type PantryItemInput = {
  name: string;
  brand?: string | null;
  category?: string | null;
  quantity?: number | null;
  unit?: string | null;
  serving_size?: number | null;
  serving_unit?: string | null;
  carbs?: number | null;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  image_url?: string | null;
  ai_analyzed?: boolean;
  notes?: string | null;
};

export async function getPantryItems(): Promise<PantryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to view your pantry.",
      };
    }

    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching pantry items:", error);

      return {
        success: false,
        error: "Failed to load pantry items. Please try again.",
      };
    }

    return { success: true, data: data as PantryItem[] };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error fetching pantry items:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function addPantryItem(
  input: PantryItemInput,
): Promise<PantryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to add a pantry item.",
      };
    }

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Please enter a food name." };
    }

    const { data, error } = await supabase
      .from("pantry_items")
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        brand: input.brand || null,
        category: input.category || "other",
        quantity: input.quantity ?? null,
        unit: input.unit || null,
        serving_size: input.serving_size ?? null,
        serving_unit: input.serving_unit || null,
        carbs: input.carbs ?? null,
        calories: input.calories ?? null,
        protein: input.protein ?? null,
        fat: input.fat ?? null,
        sugar: input.sugar ?? null,
        fiber: input.fiber ?? null,
        image_url: input.image_url || null,
        ai_analyzed: input.ai_analyzed ?? false,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error adding pantry item:", error);

      return {
        success: false,
        error: "Failed to add pantry item. Please try again.",
      };
    }

    return { success: true, data: data as PantryItem };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error adding pantry item:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updatePantryItem(
  id: string,
  input: Partial<PantryItemInput>,
): Promise<PantryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to update a pantry item.",
      };
    }

    if (!id) {
      return { success: false, error: "Item ID is required." };
    }

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Please enter a food name." };
    }

    const { data, error } = await supabase
      .from("pantry_items")
      .update({
        name: input.name.trim(),
        brand: input.brand || null,
        category: input.category || "other",
        quantity: input.quantity ?? null,
        unit: input.unit || null,
        serving_size: input.serving_size ?? null,
        serving_unit: input.serving_unit || null,
        carbs: input.carbs ?? null,
        calories: input.calories ?? null,
        protein: input.protein ?? null,
        fat: input.fat ?? null,
        sugar: input.sugar ?? null,
        fiber: input.fiber ?? null,
        image_url: input.image_url || null,
        ai_analyzed: input.ai_analyzed ?? false,
        notes: input.notes || null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating pantry item:", error);

      return {
        success: false,
        error: "Failed to update pantry item. Please try again.",
      };
    }

    return { success: true, data: data as PantryItem };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error updating pantry item:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deletePantryItem(
  id: string,
): Promise<PantryActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to delete a pantry item.",
      };
    }

    if (!id) {
      return { success: false, error: "Item ID is required." };
    }

    const { error } = await supabase
      .from("pantry_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting pantry item:", error);

      return {
        success: false,
        error: "Failed to delete pantry item. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error deleting pantry item:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function getSuggestedMeals(): Promise<MealSuggestionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to get meal suggestions.",
      };
    }

    const { data: items, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching pantry items for suggestions:", error);

      return {
        success: false,
        error: "Failed to load pantry items. Please try again.",
      };
    }

    if (!items || items.length === 0) {
      return {
        success: false,
        error:
          "Your pantry is empty! Add some items first to get meal suggestions.",
      };
    }

    const ingredientList = items
      .map((item) => {
        let entry = item.name;

        if (item.quantity && item.unit) {
          entry += ` (${item.quantity} ${item.unit})`;
        } else if (item.quantity) {
          entry += ` (${item.quantity})`;
        }

        if (item.carbs) {
          entry += ` [${item.carbs}g carbs]`;
        }

        return entry;
      })
      .join(", ");

    const prompt = `Based on these ingredients the user has: ${ingredientList}. Suggest 3 simple, diabetes-friendly meals they can make. For each meal, show: name, ingredients used, estimated carbs, calories, and brief instructions. Keep it fun and encouraging for a young person.`;

    const model = getFlashModel();

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    return { success: true, suggestions: responseText };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error getting meal suggestions:", err);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}

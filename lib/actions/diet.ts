"use server";

import type { DietPlan, DietPlanMeal } from "@/types/database";

import { createClient } from "@/lib/supabase/server";

export async function getDietPlans(): Promise<{
  data: DietPlan[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as DietPlan[], error: null };
}

export async function getDietPlan(id: string): Promise<{
  data: (DietPlan & { meals: DietPlanMeal[] }) | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: plan, error: planError } = await supabase
    .from("diet_plans")
    .select("*, meals:diet_plan_meals(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (planError) {
    return { data: null, error: planError.message };
  }

  if (!plan) {
    return { data: null, error: "Diet plan not found" };
  }

  return {
    data: plan as DietPlan & { meals: DietPlanMeal[] },
    error: null,
  };
}

export async function createDietPlan(
  data: Partial<DietPlan>,
): Promise<{ data: DietPlan | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: plan, error } = await supabase
    .from("diet_plans")
    .insert({
      user_id: user.id,
      name: data.name || "My Diet Plan",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      target_daily_carbs: data.target_daily_carbs || null,
      target_daily_calories: data.target_daily_calories || null,
      excluded_foods: data.excluded_foods || null,
      included_foods: data.included_foods || null,
      dietary_restrictions: data.dietary_restrictions || null,
      ai_generated: data.ai_generated ?? true,
      status: data.status || "draft",
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: plan as DietPlan, error: null };
}

export async function saveDietPlanMeals(
  planId: string,
  meals: Partial<DietPlanMeal>[],
): Promise<{ data: DietPlanMeal[]; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: [], error: "Unauthorized" };
  }

  // Verify the plan belongs to the user
  const { data: plan } = await supabase
    .from("diet_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (!plan) {
    return { data: [], error: "Diet plan not found or access denied" };
  }

  const mealsToInsert = meals.map((meal) => ({
    diet_plan_id: planId,
    day_of_week: meal.day_of_week ?? 0,
    meal_type: meal.meal_type || "breakfast",
    meal_name: meal.meal_name || "Meal",
    description: meal.description || null,
    ingredients: meal.ingredients || null,
    carbs: meal.carbs || null,
    calories: meal.calories || null,
    protein: meal.protein || null,
    fat: meal.fat || null,
    sugar: meal.sugar || null,
    fiber: meal.fiber || null,
    recommended_insulin: meal.recommended_insulin || null,
    portion_notes: meal.portion_notes || null,
  }));

  const { data, error } = await supabase
    .from("diet_plan_meals")
    .insert(mealsToInsert)
    .select();

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as DietPlanMeal[], error: null };
}

export async function updateDietPlanStatus(
  id: string,
  status: DietPlan["status"],
): Promise<{ data: DietPlan | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: plan, error } = await supabase
    .from("diet_plans")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: plan as DietPlan, error: null };
}

export async function deleteDietPlan(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Delete meals first (cascade)
  await supabase.from("diet_plan_meals").delete().eq("diet_plan_id", id);

  // Delete the plan
  const { error } = await supabase
    .from("diet_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

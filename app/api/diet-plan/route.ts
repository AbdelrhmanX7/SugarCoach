import type { DietPlanMeal } from "@/types/database";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getFlashModel } from "@/lib/gemini/client";
import { buildDietPlanPromptWithPreferences } from "@/lib/gemini/prompts";

interface GeminiMeal {
  meal_type: string;
  meal_name: string;
  description: string;
  ingredients: string[];
  portion_notes: string;
  carbs: number;
  calories: number;
  protein: number;
  fat: number;
  sugar: number;
  fiber: number;
  recommended_insulin: number;
}

interface GeminiDay {
  day: number;
  day_name: string;
  meals: GeminiMeal[];
}

interface GeminiPlanResponse {
  plan_name: string;
  days: GeminiDay[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      targetDailyCarbs,
      targetDailyCalories,
      excludedFoods,
      includedFoods,
      dietaryRestrictions,
      name,
    }: {
      targetDailyCarbs?: number;
      targetDailyCalories?: number;
      excludedFoods?: string[];
      includedFoods?: string[];
      dietaryRestrictions?: string[];
      name?: string;
    } = body;

    // Get user profile for diabetes settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete your profile first." },
        { status: 400 },
      );
    }

    // Build the prompt with user preferences
    const prompt = buildDietPlanPromptWithPreferences(profile, {
      excludedFoods,
      includedFoods,
      dietaryRestrictions,
      targetDailyCarbs,
      targetDailyCalories,
    });

    // Call Gemini Flash model
    const model = getFlashModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const responseText = result.response.text();

    // Parse JSON from response (handle markdown code fences)
    let planData: GeminiPlanResponse;

    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

      planData = JSON.parse(jsonStr);
    } catch {
      // eslint-disable-next-line no-console
      console.error("Failed to parse Gemini response:", responseText);

      return NextResponse.json(
        { error: "Failed to parse the generated diet plan. Please try again." },
        { status: 500 },
      );
    }

    // Calculate date range (7 days starting from next Sunday)
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
    const startDate = new Date(today);

    startDate.setDate(today.getDate() + daysUntilSunday);

    const endDate = new Date(startDate);

    endDate.setDate(startDate.getDate() + 6);

    // Create the diet plan row
    const { data: dietPlan, error: planError } = await supabase
      .from("diet_plans")
      .insert({
        user_id: user.id,
        name: name || planData.plan_name || "AI Generated Diet Plan",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        target_daily_carbs: targetDailyCarbs || null,
        target_daily_calories: targetDailyCalories || null,
        excluded_foods: excludedFoods || null,
        included_foods: includedFoods || null,
        dietary_restrictions: dietaryRestrictions || null,
        ai_generated: true,
        status: "draft",
      })
      .select()
      .single();

    if (planError || !dietPlan) {
      // eslint-disable-next-line no-console
      console.error("Error creating diet plan:", planError);

      return NextResponse.json(
        { error: "Failed to save diet plan." },
        { status: 500 },
      );
    }

    // Convert Gemini response to DietPlanMeal format
    const mealsToInsert: Partial<DietPlanMeal>[] = [];

    for (const day of planData.days) {
      for (const meal of day.meals) {
        mealsToInsert.push({
          diet_plan_id: dietPlan.id,
          day_of_week: day.day,
          meal_type: meal.meal_type as DietPlanMeal["meal_type"],
          meal_name: meal.meal_name,
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
        });
      }
    }

    // Save all meals
    const { data: savedMeals, error: mealsError } = await supabase
      .from("diet_plan_meals")
      .insert(mealsToInsert)
      .select();

    if (mealsError) {
      // eslint-disable-next-line no-console
      console.error("Error saving meals:", mealsError);
      // Plan was created but meals failed - clean up
      await supabase.from("diet_plans").delete().eq("id", dietPlan.id);

      return NextResponse.json(
        { error: "Failed to save meal plans. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      plan: dietPlan,
      meals: savedMeals,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Diet plan API error:", error);

    return NextResponse.json(
      { error: "Failed to generate diet plan. Please try again." },
      { status: 500 },
    );
  }
}

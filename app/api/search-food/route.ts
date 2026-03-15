import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getFlashModel } from "@/lib/gemini/client";
import { extractStructuredData } from "@/lib/gemini/parse-response";

type NutritionResult = {
  name: string;
  brand: string | null;
  category: string;
  serving_size: number | null;
  serving_unit: string | null;
  carbs: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
  source: "open_food_facts" | "gemini";
};

/**
 * Search Open Food Facts by product name.
 * Free API, no key needed. Returns nutrition per 100g.
 */
async function searchOpenFoodFacts(
  query: string,
): Promise<NutritionResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1&fields=product_name,brands,categories_tags,nutriments,serving_size`;

    const res = await fetch(url, {
      headers: { "User-Agent": "SugarCoach/1.0 (diabetes-app)" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (!data.products || data.products.length === 0) return null;

    const product = data.products[0];
    const n = product.nutriments || {};

    // Need at least a name and some nutrition data
    if (!product.product_name || (!n.carbohydrates_100g && !n.energy_kcal_100g))
      return null;

    // Parse serving size from string like "30g" or "1 piece (25g)"
    let servingSize: number | null = 100;
    let servingUnit: string | null = "g";

    if (product.serving_size) {
      const match = product.serving_size.match(
        /(\d+(?:\.\d+)?)\s*(g|ml|oz|piece|slice|cup)?/i,
      );

      if (match) {
        servingSize = parseFloat(match[1]);
        servingUnit = match[2]?.toLowerCase() || "g";
      }
    }

    // Map categories_tags to our categories
    const categoryTags = (product.categories_tags || []) as string[];
    let category = "other";

    if (categoryTags.some((t: string) => t.includes("dairy")))
      category = "dairy";
    else if (
      categoryTags.some(
        (t: string) =>
          t.includes("meat") || t.includes("fish") || t.includes("poultry"),
      )
    )
      category = "protein";
    else if (
      categoryTags.some(
        (t: string) =>
          t.includes("fruit") ||
          t.includes("vegetable") ||
          t.includes("produce"),
      )
    )
      category = "produce";
    else if (
      categoryTags.some(
        (t: string) =>
          t.includes("cereal") ||
          t.includes("bread") ||
          t.includes("grain") ||
          t.includes("pasta"),
      )
    )
      category = "grains";
    else if (
      categoryTags.some(
        (t: string) => t.includes("snack") || t.includes("candy"),
      )
    )
      category = "snacks";
    else if (
      categoryTags.some(
        (t: string) => t.includes("beverage") || t.includes("drink"),
      )
    )
      category = "beverages";
    else if (
      categoryTags.some(
        (t: string) => t.includes("sauce") || t.includes("condiment"),
      )
    )
      category = "condiments";

    return {
      name: product.product_name,
      brand: product.brands || null,
      category,
      serving_size: servingSize,
      serving_unit: servingUnit,
      carbs: n.carbohydrates_100g ?? null,
      calories: n["energy-kcal_100g"] ?? null,
      protein: n.proteins_100g ?? null,
      fat: n.fat_100g ?? null,
      sugar: n.sugars_100g ?? null,
      fiber: n.fiber_100g ?? null,
      source: "open_food_facts",
    };
  } catch {
    return null;
  }
}

/**
 * Fallback: use Gemini to estimate nutrition data.
 */
async function searchWithGemini(
  query: string,
): Promise<NutritionResult | null> {
  try {
    const model = getFlashModel();

    const prompt = `Look up the nutrition information for: ${query.trim()}. Return a JSON object with these fields: name (string), brand (string or null), category (one of: produce, dairy, protein, grains, snacks, beverages, condiments, other), serving_size (number), serving_unit (string like 'g', 'ml', 'piece'), carbs (number in grams per serving), calories (number per serving), protein (number in grams per serving), fat (number in grams per serving), sugar (number in grams per serving), fiber (number in grams per serving). Return ONLY the JSON object, no other text. Use typical serving sizes. If the food is not recognized, return { "error": "Food not found" }.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const blocks = extractStructuredData(responseText);

    if (blocks.length === 0) return null;

    const d = blocks[0] as Record<string, unknown>;

    if (d.error) return null;

    return {
      name: (d.name as string) || query,
      brand: (d.brand as string) || null,
      category: (d.category as string) || "other",
      serving_size: (d.serving_size as number) ?? null,
      serving_unit: (d.serving_unit as string) ?? null,
      carbs: (d.carbs as number) ?? null,
      calories: (d.calories as number) ?? null,
      protein: (d.protein as number) ?? null,
      fat: (d.fat as number) ?? null,
      sugar: (d.sugar as number) ?? null,
      fiber: (d.fiber as number) ?? null,
      source: "gemini",
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body as { query?: string };

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    // 1. Try Open Food Facts first (real product database)
    const offResult = await searchOpenFoodFacts(query.trim());

    if (offResult) {
      return NextResponse.json({ nutrition: offResult });
    }

    // 2. Fallback to Gemini AI estimation
    const geminiResult = await searchWithGemini(query.trim());

    if (geminiResult) {
      return NextResponse.json({ nutrition: geminiResult });
    }

    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Food search API error:", error);

    return NextResponse.json(
      { error: "Failed to search for food" },
      { status: 500 },
    );
  }
}

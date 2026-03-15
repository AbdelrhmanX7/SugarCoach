import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getFlashModel } from "@/lib/gemini/client";
import { FOOD_ANALYSIS_PROMPT } from "@/lib/gemini/prompts";
import { extractStructuredData } from "@/lib/gemini/parse-response";

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

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid image format. Supported formats: JPEG, PNG, WebP, HEIC, HEIF",
        },
        { status: 400 },
      );
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Use Gemini Flash model with the food analysis prompt
    const model = getFlashModel();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: FOOD_ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const response = result.response;
    const responseText = response.text();

    // Extract structured nutrition data
    const structuredBlocks = extractStructuredData(responseText);
    const nutritionData =
      structuredBlocks.length > 0 ? structuredBlocks[0] : null;

    if (!nutritionData) {
      return NextResponse.json(
        { error: "Failed to analyze food image" },
        { status: 422 },
      );
    }

    // Extract a food name from the items array
    const items = (nutritionData.items as Array<{ name?: string }>) || [];
    const foodName =
      items.length === 1
        ? items[0]?.name || "Unknown Food"
        : items.length > 1
          ? items
              .map((i) => i.name)
              .filter(Boolean)
              .join(", ") || "Mixed Food"
          : "Unknown Food";

    // Upload image to Supabase Storage if available
    let imageUrl: string | null = null;

    try {
      const fileName = `pantry/${user.id}/${Date.now()}-${imageFile.name || "photo.jpg"}`;

      const { data: uploadData } = await supabase.storage
        .from("food-images")
        .upload(fileName, new Uint8Array(arrayBuffer), {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadData?.path) {
        const { data: urlData } = supabase.storage
          .from("food-images")
          .getPublicUrl(uploadData.path);

        imageUrl = urlData?.publicUrl || null;
      }
    } catch {
      // Storage upload is optional — continue without it
    }

    return NextResponse.json({
      nutrition: nutritionData,
      food_name: foodName,
      image_url: imageUrl,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Food analysis API error:", error);

    return NextResponse.json(
      { error: "Failed to analyze food image" },
      { status: 500 },
    );
  }
}

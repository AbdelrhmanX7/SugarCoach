import type { Content } from "@google/generative-ai";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getFlashModel } from "@/lib/gemini/client";
import {
  buildChatPromptWithProfile,
  CHAT_SYSTEM_PROMPT,
} from "@/lib/gemini/prompts";
import {
  extractStructuredData,
  parseBloodSugar,
  parseInsulin,
  parseMeal,
} from "@/lib/gemini/parse-response";

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
      message,
      history,
    }: {
      message: string;
      history?: { role: string; content: string }[];
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Get user profile to personalize the system prompt
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const systemPrompt = profile
      ? buildChatPromptWithProfile(profile)
      : CHAT_SYSTEM_PROMPT;

    // Build chat history in Gemini format
    const chatHistory: Content[] = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        const role = msg.role === "assistant" ? "model" : "user";

        chatHistory.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Generate response using Gemini Flash
    const model = getFlashModel();
    const contents: Content[] = [
      ...chatHistory,
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const result = await model.generateContent({
      contents,
      systemInstruction: {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    });

    const response = result.response;
    const responseText = response.text();

    // Extract structured data from the response
    const structuredDataBlocks = extractStructuredData(responseText);

    // Process each structured data block
    let structuredData:
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null = null;

    // Parse and enrich structured data blocks
    const parsedItems: Record<string, unknown>[] = [];

    for (const block of structuredDataBlocks) {
      const type = block.type as string;

      if (type === "blood_sugar") {
        const parsed = parseBloodSugar(block);

        if (parsed) parsedItems.push({ type: "blood_sugar", data: parsed });
      } else if (type === "insulin") {
        const parsed = parseInsulin(block);

        if (parsed) parsedItems.push({ type: "insulin", data: parsed });
      } else if (type === "meal") {
        const parsed = parseMeal(block);

        if (parsed) {
          // Enrich the raw block with parsed totals so the UI card can display them
          block.total_carbs =
            block.total_carbs ?? parsed.meal.total_carbs ?? null;
          block.total_calories =
            block.total_calories ?? parsed.meal.total_calories ?? null;
          block.total_protein =
            block.total_protein ?? parsed.meal.total_protein ?? null;
          block.total_fat = block.total_fat ?? parsed.meal.total_fat ?? null;
          block.total_sugar =
            block.total_sugar ?? parsed.meal.total_sugar ?? null;
          block.total_fiber =
            block.total_fiber ?? parsed.meal.total_fiber ?? null;

          // Also normalize item carbs field (estimated_carbs → carbs)
          if (Array.isArray(block.items)) {
            for (const item of block.items as Record<string, unknown>[]) {
              if (item.estimated_carbs != null && item.carbs == null) {
                item.carbs = item.estimated_carbs;
              }
            }
          }

          parsedItems.push({ type: "meal", data: parsed });
        }
      }
    }

    if (structuredDataBlocks.length === 1) {
      structuredData = structuredDataBlocks[0];
    } else if (structuredDataBlocks.length > 1) {
      structuredData = structuredDataBlocks;
    }

    // Save user message to chat_messages
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user" as const,
      content: message,
      message_type: "text" as const,
      structured_data: null,
      data_saved: false,
    });

    // Save assistant message to chat_messages
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant" as const,
      content: responseText,
      message_type: "text" as const,
      structured_data: structuredData,
      data_saved: false,
    });

    return NextResponse.json({
      message: responseText,
      structuredData,
      parsedItems: parsedItems.length > 0 ? parsedItems : null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 },
    );
  }
}

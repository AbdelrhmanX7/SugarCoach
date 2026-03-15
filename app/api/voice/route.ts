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

const VOICE_SYSTEM_PROMPT_PREFIX = `You will receive an audio message from the user. Follow these steps:

1. First, transcribe the audio content exactly as spoken.
2. Then, process the transcribed content as if it were a text message.
3. In your response, start with "I heard: [transcription]" followed by your normal response.

`;

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
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    // Validate audio file type
    const validTypes = [
      "audio/webm",
      "audio/wav",
      "audio/mp3",
      "audio/mpeg",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
    ];

    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid audio format. Supported formats: WebM, WAV, MP3, OGG, MP4, M4A",
        },
        { status: 400 },
      );
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Get user profile for personalized system prompt
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const basePrompt = profile
      ? buildChatPromptWithProfile(profile)
      : CHAT_SYSTEM_PROMPT;

    const systemPrompt = VOICE_SYSTEM_PROMPT_PREFIX + basePrompt;

    // Use Gemini Flash model with audio
    const model = getFlashModel();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: audioFile.type,
                data: base64Data,
              },
            },
          ],
        },
      ],
      systemInstruction: {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    });

    const response = result.response;
    const responseText = response.text();

    // Extract transcription from response
    let transcription = "";
    const transcriptionMatch = responseText.match(
      /I heard:\s*"?([^"]*?)"?\s*(?:\n|$)/i,
    );

    if (transcriptionMatch) {
      transcription = transcriptionMatch[1].trim();
    }

    // Extract structured data from the response
    const structuredDataBlocks = extractStructuredData(responseText);

    let structuredData:
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null = null;

    if (structuredDataBlocks.length === 1) {
      structuredData = structuredDataBlocks[0];
    } else if (structuredDataBlocks.length > 1) {
      structuredData = structuredDataBlocks;
    }

    // Parse specific data types
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

        if (parsed) parsedItems.push({ type: "meal", data: parsed });
      }
    }

    // Save user voice message to chat_messages
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user" as const,
      content: transcription || "[Voice message]",
      message_type: "voice" as const,
      structured_data: null,
      data_saved: false,
    });

    // Save assistant response to chat_messages
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
      transcription,
      structuredData,
      parsedItems: parsedItems.length > 0 ? parsedItems : null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Voice API error:", error);

    return NextResponse.json(
      { error: "Failed to process voice message" },
      { status: 500 },
    );
  }
}

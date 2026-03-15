import type { ChatMessage } from "@/types/database";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";

interface ChatState {
  isLoading: boolean;
  isRecording: boolean;
  messages: ChatMessage[];
}

interface ChatActions {
  loadHistory: () => Promise<void>;
  sendImage: (imageFile: File) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendVoice: (audioBlob: Blob) => Promise<void>;
  setRecording: (val: boolean) => void;
}

type ChatStore = ChatActions & ChatState;

export const useChatStore = create<ChatStore>((set, get) => ({
  isLoading: false,
  isRecording: false,
  messages: [],

  loadHistory: async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      set({ messages: data as ChatMessage[] });
    }
  },

  sendImage: async (imageFile: File) => {
    const { messages } = get();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: "",
      role: "user",
      content: `Analyzing food image: ${imageFile.name}`,
      message_type: "image",
      image_url: URL.createObjectURL(imageFile),
      structured_data: null,
      data_saved: false,
      created_at: new Date().toISOString(),
    };

    set({ messages: [...messages, userMessage], isLoading: true });

    try {
      const formData = new FormData();

      formData.append("image", imageFile);

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: "Here is the nutrition analysis for your food:",
        message_type: "text",
        image_url: null,
        structured_data: data.nutrition,
        data_saved: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content:
          "Sorry, I could not analyze that image. Please try again with a clearer photo.",
        message_type: "text",
        image_url: null,
        structured_data: null,
        data_saved: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  sendMessage: async (message: string) => {
    const { messages } = get();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: "",
      role: "user",
      content: message,
      message_type: "text",
      image_url: null,
      structured_data: null,
      data_saved: false,
      created_at: new Date().toISOString(),
    };

    set({ messages: [...messages, userMessage], isLoading: true });

    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .slice(-20)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: data.message,
        message_type: "text",
        image_url: null,
        structured_data: data.structuredData || null,
        data_saved: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: "Sorry, something went wrong. Please try again!",
        message_type: "text",
        image_url: null,
        structured_data: null,
        data_saved: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  sendVoice: async (audioBlob: Blob) => {
    const { messages } = get();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: "",
      role: "user",
      content: "Voice message...",
      message_type: "voice",
      image_url: null,
      structured_data: null,
      data_saved: false,
      created_at: new Date().toISOString(),
    };

    set({ messages: [...messages, userMessage], isLoading: true });

    try {
      const formData = new FormData();

      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process voice");
      }

      // Update user message with transcription
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === userMessage.id
            ? { ...m, content: data.transcription || "Voice message" }
            : m,
        ),
      }));

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: data.message,
        message_type: "text",
        image_url: null,
        structured_data: data.structuredData || null,
        data_saved: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content:
          "Sorry, I could not process your voice message. Please try again!",
        message_type: "text",
        image_url: null,
        structured_data: null,
        data_saved: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  setRecording: (val: boolean) => {
    set({ isRecording: val });
  },
}));

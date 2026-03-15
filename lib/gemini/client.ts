import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini 3 — best for complex multimodal (chat, vision, voice)
export function getFlashModel() {
  return genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
}

// Gemini 3.1 Pro — reasoning-first, best for complex tasks (diet plans, analysis)
export function getProModel() {
  return genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
}

// Gemini 3.1 Flash Lite — cheapest, fastest, for simple tasks (A1C estimation)
export function getFlashLiteModel() {
  return genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
}

export { genAI };

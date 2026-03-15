"use client";

import type { ChatMessage } from "@/types/database";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropletIcon,
  InjectionIcon,
  Restaurant01Icon,
  ChartLineData01Icon,
  Camera01Icon,
  Mic01Icon,
} from "@hugeicons/core-free-icons";

import { ChatBubble } from "./chat-bubble";

interface ChatWindowProps {
  isLoading: boolean;
  messages: ChatMessage[];
  onDataSaved?: (messageId: string) => void;
  onSuggest?: (text: string) => void;
}

const suggestions = [
  {
    text: "My blood sugar is 120 mg/dL",
    icon: DropletIcon,
    color: "text-rose-500",
  },
  {
    text: "I took 5 units of NovoRapid",
    icon: InjectionIcon,
    color: "text-blue-500",
  },
  {
    text: "I had a sandwich for lunch",
    icon: Restaurant01Icon,
    color: "text-amber-500",
  },
  {
    text: "Show me today's stats",
    icon: ChartLineData01Icon,
    color: "text-emerald-500",
  },
];

export function ChatWindow({
  isLoading,
  messages,
  onDataSaved,
  onSuggest,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">
            {/* Welcome */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">
                What would you like to log?
              </h2>
              <p className="mt-1 text-sm text-default-400">
                Tell me naturally — I&apos;ll parse it and help you track.
              </p>
            </div>

            {/* Suggestion buttons */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {suggestions.map((item) => (
                <button
                  key={item.text}
                  className="flex items-center gap-3 rounded-xl border border-default-200 bg-content1 px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  type="button"
                  onClick={() => onSuggest?.(item.text)}
                >
                  <HugeiconsIcon
                    className={`shrink-0 ${item.color}`}
                    color="currentColor"
                    icon={item.icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                  <span className="text-sm text-default-600">{item.text}</span>
                </button>
              ))}
            </div>

            {/* Capabilities hint */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-default-400">
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon
                  color="currentColor"
                  icon={Camera01Icon}
                  size={14}
                />
                Photo meals
              </span>
              <span className="h-3 w-px bg-divider" />
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon
                  color="currentColor"
                  icon={Mic01Icon}
                  size={14}
                />
                Voice input
              </span>
              <span className="h-3 w-px bg-divider" />
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon
                  color="currentColor"
                  icon={ChartLineData01Icon}
                  size={14}
                />
                Auto-tracking
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            onDataSaved={onDataSaved}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-3 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-primary-foreground">
              SC
            </span>
          </div>
          <div className="flex gap-1.5 rounded-2xl bg-default-100 px-4 py-3">
            <motion.span
              animate={{ y: [0, -4, 0] }}
              className="h-2 w-2 rounded-full bg-default-400"
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              className="h-2 w-2 rounded-full bg-default-400"
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              className="h-2 w-2 rounded-full bg-default-400"
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

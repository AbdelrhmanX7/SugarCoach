"use client";

import type { ChatMessage } from "@/types/database";

import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import { StructuredDataCard } from "./structured-data-card";

interface ChatBubbleProps {
  message: ChatMessage;
  onDataSaved?: (messageId: string) => void;
}

export function ChatBubble({ message, onDataSaved }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const hasStructuredData =
    message.structured_data !== null &&
    message.structured_data !== undefined &&
    Object.keys(message.structured_data).length > 0;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar
          className="shrink-0"
          classNames={{
            base: "bg-primary",
            name: "text-white text-xs font-bold",
          }}
          name="SC"
          size="sm"
        />
      )}

      {/* Bubble content */}
      <div
        className={`flex max-w-[80%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Image preview for image messages */}
        {message.message_type === "image" && message.image_url && (
          <div className="overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Food"
              className="h-auto max-h-48 w-auto max-w-full rounded-xl object-cover"
              src={message.image_url}
            />
          </div>
        )}

        {/* Voice indicator */}
        {message.message_type === "voice" && isUser && (
          <div className="flex items-center gap-1.5 text-xs text-default-400">
            <HugeiconsIcon color="currentColor" icon={Mic01Icon} size={14} />
            Voice message
          </div>
        )}

        {/* Message text — strip JSON code blocks from AI responses */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-default-100 text-foreground"
          }`}
        >
          <p className="whitespace-pre-wrap">
            {isUser
              ? message.content
              : message.content
                  .replace(/```json\s*[\s\S]*?```/g, "")
                  .replace(/\n{3,}/g, "\n\n")
                  .trim()}
          </p>
        </div>

        {/* Structured data cards — handle both single objects and arrays */}
        {hasStructuredData &&
          !message.data_saved &&
          (Array.isArray(message.structured_data) ? (
            (message.structured_data as Record<string, unknown>[]).map(
              (item, idx) => (
                <StructuredDataCard
                  key={`${message.id}-${idx}`}
                  data={item}
                  messageId={message.id}
                  onSaved={() => onDataSaved?.(message.id)}
                />
              ),
            )
          ) : (
            <StructuredDataCard
              data={message.structured_data!}
              messageId={message.id}
              onSaved={() => onDataSaved?.(message.id)}
            />
          ))}

        {/* Saved badge */}
        {hasStructuredData && message.data_saved && (
          <Chip
            color="success"
            size="sm"
            startContent={
              <HugeiconsIcon
                color="currentColor"
                icon={Tick02Icon}
                size={12}
                strokeWidth={2.5}
              />
            }
            variant="flat"
          >
            Saved
          </Chip>
        )}

        {/* Timestamp */}
        <span className="px-1 text-[10px] text-default-300">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}

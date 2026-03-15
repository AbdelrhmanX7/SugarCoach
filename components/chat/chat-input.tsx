"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Camera01Icon,
  Mic01Icon,
  StopIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";

interface ChatInputProps {
  isLoading: boolean;
  isRecording: boolean;
  onSendImage: (file: File) => void;
  onSendMessage: (message: string) => void;
  onToggleRecording: () => void;
}

export function ChatInput({
  isLoading,
  isRecording,
  onSendImage,
  onSendMessage,
  onToggleRecording,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();

    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      onSendImage(file);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      {/* Gradient glow line above input */}
      <div className="chat-input-glow h-px w-full" />

      <div className="bg-content1/60 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5">
          {/* Camera / image button */}
          <Button
            isIconOnly
            aria-label="Send food photo"
            className="shrink-0 border border-white/5 bg-white/5 text-default-400 hover:bg-white/10 hover:text-default-300"
            isDisabled={isLoading || isRecording}
            radius="full"
            size="md"
            variant="flat"
            onPress={() => fileInputRef.current?.click()}
          >
            <HugeiconsIcon color="currentColor" icon={Camera01Icon} size={20} />
          </Button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            type="file"
            onChange={handleImageSelect}
          />

          {/* Mic button */}
          <Button
            isIconOnly
            aria-label={
              isRecording ? "Stop recording" : "Start voice recording"
            }
            className={`shrink-0 ${
              isRecording
                ? "border-danger/30 bg-danger/15 text-danger"
                : "border border-white/5 bg-white/5 text-default-400 hover:bg-white/10 hover:text-default-300"
            }`}
            color={isRecording ? "danger" : "default"}
            isDisabled={isLoading}
            radius="full"
            size="md"
            variant={isRecording ? "solid" : "flat"}
            onPress={onToggleRecording}
          >
            {isRecording ? (
              <HugeiconsIcon color="currentColor" icon={StopIcon} size={20} />
            ) : (
              <HugeiconsIcon
                color="currentColor"
                icon={Mic01Icon}
                size={20}
                strokeWidth={1.8}
              />
            )}
          </Button>

          {/* Text input */}
          <Input
            className="flex-1"
            classNames={{
              inputWrapper:
                "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm group-data-[focus=true]:bg-white/10 group-data-[focus=true]:border-violet-500/30 transition-colors",
            }}
            id="chat-message-input"
            isDisabled={isLoading || isRecording}
            placeholder={
              isRecording
                ? "Recording..."
                : "Tell me about your sugar, meals, or insulin..."
            }
            size="md"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Send button */}
          <Button
            isIconOnly
            aria-label="Send message"
            className="shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-primary/40"
            isDisabled={!inputValue.trim() || isLoading || isRecording}
            radius="full"
            size="md"
            onPress={handleSubmit}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={SentIcon}
              size={20}
              strokeWidth={2}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

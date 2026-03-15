"use client";

import { useCallback, useEffect } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatWindow } from "@/components/chat/chat-window";
import { VoiceRecorder } from "@/components/chat/voice-recorder";
import { useChatStore } from "@/lib/stores/chat-store";

export default function ChatPage() {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const isRecording = useChatStore((s) => s.isRecording);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendVoice = useChatStore((s) => s.sendVoice);
  const sendImage = useChatStore((s) => s.sendImage);
  const setRecording = useChatStore((s) => s.setRecording);
  const loadHistory = useChatStore((s) => s.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleToggleRecording = useCallback(() => {
    setRecording(!isRecording);
  }, [isRecording, setRecording]);

  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      setRecording(false);
      sendVoice(blob);
    },
    [sendVoice, setRecording],
  );

  const handleDataSaved = useCallback((messageId: string) => {
    // Update the message in the store to reflect saved state
    useChatStore.setState((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, data_saved: true } : m,
      ),
    }));
  }, []);

  const handleSuggest = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  return (
    <div className="fixed inset-0 flex flex-col lg:left-[260px]">
      {/* Chat messages area — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ChatWindow
          isLoading={isLoading}
          messages={messages}
          onDataSaved={handleDataSaved}
          onSuggest={handleSuggest}
        />
      </div>

      {/* Voice recorder indicator */}
      {isRecording && (
        <div className="px-4 pb-2">
          <VoiceRecorder
            isRecording={isRecording}
            onRecordingComplete={handleRecordingComplete}
            onToggle={handleToggleRecording}
          />
        </div>
      )}

      {/* Chat input */}
      <div className="shrink-0 pb-[3.25rem] lg:pb-0">
        <ChatInput
          isLoading={isLoading}
          isRecording={isRecording}
          onSendImage={sendImage}
          onSendMessage={sendMessage}
          onToggleRecording={handleToggleRecording}
        />
      </div>
    </div>
  );
}

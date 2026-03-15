"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface VoiceRecorderProps {
  isRecording: boolean;
  onRecordingComplete: (blob: Blob) => void;
  onToggle: () => void;
}

export function VoiceRecorder({
  isRecording,
  onRecordingComplete,
  onToggle,
}: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported mime type
      let mimeType = "audio/webm";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm;codecs=opus";
      }

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/ogg;codecs=opus";
      }

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        onRecordingComplete(blob);
        chunksRef.current = [];

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setDuration(0);
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      // eslint-disable-next-line no-console
      console.warn("Microphone access denied or unavailable.");
      onToggle();
    }
  }, [onRecordingComplete, onToggle]);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, startRecording, stopRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRecording) {
    return null;
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl bg-danger-50 px-4 py-2.5 dark:bg-danger-50/10"
      exit={{ opacity: 0, y: 8 }}
      initial={{ opacity: 0, y: 8 }}
    >
      {/* Pulsing red dot */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0.6, 1],
        }}
        className="h-3 w-3 rounded-full bg-danger"
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <span className="text-sm font-medium text-danger">Recording</span>

      <span className="font-mono text-sm text-danger-400">
        {formatDuration(duration)}
      </span>

      <button
        className="ml-auto rounded-lg bg-danger px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-danger-600"
        type="button"
        onClick={onToggle}
      >
        Stop
      </button>
    </motion.div>
  );
}

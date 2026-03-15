"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@heroui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Clock01Icon,
  Restaurant01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

const PRESETS = [5, 10, 15, 20];
const STORAGE_KEY = "sugarcoach-meal-timer";

type TimerState =
  | { status: "idle" }
  | { status: "running"; endTime: number; totalSeconds: number }
  | { status: "done"; endTime: number };

function loadTimer(): TimerState {
  if (typeof window === "undefined") return { status: "idle" };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return { status: "idle" };
    const saved = JSON.parse(raw) as TimerState;

    if (saved.status === "running") {
      if (Date.now() >= saved.endTime) {
        // Timer finished while away
        const updated: TimerState = { status: "done", endTime: saved.endTime };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        return updated;
      }

      return saved;
    }

    if (saved.status === "done") return saved;

    return { status: "idle" };
  } catch {
    return { status: "idle" };
  }
}

function saveTimer(state: TimerState) {
  if (typeof window === "undefined") return;

  if (state.status === "idle") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function formatAgo(endTime: number): string {
  const agoMs = Date.now() - endTime;
  const agoMin = Math.floor(agoMs / 60000);

  if (agoMin < 1) return "just now";
  if (agoMin === 1) return "1 min ago";

  return `${agoMin} min ago`;
}

export function MealTimer() {
  const [timer, setTimer] = useState<TimerState>({ status: "idle" });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [agoText, setAgoText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadTimer();

    setTimer(loaded);
    if (loaded.status === "running") {
      setSecondsLeft(Math.max(0, Math.ceil((loaded.endTime - Date.now()) / 1000)));
    }
    if (loaded.status === "done") {
      setAgoText(formatAgo(loaded.endTime));
    }
  }, []);

  // Tick interval
  useEffect(() => {
    if (timer.status !== "running" && timer.status !== "done") return;

    intervalRef.current = setInterval(() => {
      if (timer.status === "running") {
        const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));

        if (remaining <= 0) {
          const doneState: TimerState = { status: "done", endTime: timer.endTime };

          setTimer(doneState);
          saveTimer(doneState);
          setSecondsLeft(0);
          setAgoText(formatAgo(timer.endTime));

          // Notify once
          if (!notifiedRef.current) {
            notifiedRef.current = true;
            playSound();
            sendNotification();
          }
        } else {
          setSecondsLeft(remaining);
        }
      }

      if (timer.status === "done") {
        setAgoText(formatAgo(timer.endTime));
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer]);

  // Request notification permission
  useEffect(() => {
    if (timer.status === "running" && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [timer.status]);

  const startTimer = useCallback((minutes: number) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    const state: TimerState = {
      status: "running",
      endTime,
      totalSeconds: minutes * 60,
    };

    notifiedRef.current = false;
    setTimer(state);
    setSecondsLeft(minutes * 60);
    saveTimer(state);
  }, []);

  const dismiss = useCallback(() => {
    setTimer({ status: "idle" });
    saveTimer({ status: "idle" });
    setSecondsLeft(0);
    setAgoText("");
  }, []);

  // Idle — show presets
  if (timer.status === "idle") {
    return (
      <div className="flex items-center gap-2.5">
        <HugeiconsIcon
          className="shrink-0 text-default-400"
          color="currentColor"
          icon={Clock01Icon}
          size={16}
          strokeWidth={1.8}
        />
        <span className="shrink-0 text-xs font-medium text-default-500">
          Meal timer
        </span>
        <div className="flex gap-1.5">
          {PRESETS.map((min) => (
            <button
              key={min}
              className="rounded-full border border-default-200 px-3 py-1 text-xs font-medium text-default-600 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              type="button"
              onClick={() => startTimer(min)}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Done — show finished message with "ago" timer
  if (timer.status === "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5">
        <HugeiconsIcon
          className="shrink-0 text-success"
          color="currentColor"
          icon={Restaurant01Icon}
          size={20}
          strokeWidth={1.8}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-success">Time to eat!</p>
          <p className="text-xs text-default-400">
            Finished {agoText}
          </p>
        </div>
        <Button
          className="shrink-0"
          size="sm"
          startContent={
            <HugeiconsIcon color="currentColor" icon={Tick02Icon} size={14} />
          }
          variant="flat"
          onPress={dismiss}
        >
          Done
        </Button>
      </div>
    );
  }

  // Running — show countdown
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress =
    timer.totalSeconds > 0
      ? ((timer.totalSeconds - secondsLeft) / timer.totalSeconds) * 100
      : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
      <HugeiconsIcon
        className="shrink-0 text-primary"
        color="currentColor"
        icon={Clock01Icon}
        size={20}
        strokeWidth={1.8}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tabular-nums text-foreground">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-default-400">before your meal</span>
        </div>
        {/* Thin progress bar */}
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <button
        className="shrink-0 rounded-md p-1 text-default-400 transition-colors hover:bg-danger/10 hover:text-danger"
        type="button"
        onClick={dismiss}
      >
        <HugeiconsIcon
          color="currentColor"
          icon={Cancel01Icon}
          size={16}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}

/* ---- Helpers ---- */

function playSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio not available
  }
}

function sendNotification() {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Time to eat!", {
      body: "Your meal timer is done. Enjoy your food!",
    });
  }
}

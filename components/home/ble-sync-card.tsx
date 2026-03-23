"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Spinner } from "@heroui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BluetoothIcon,
  BluetoothNotConnectedIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";

import {
  isWebBluetoothSupported,
  getStoredDeviceName,
  getLastSyncTime,
  requestGlucoseMeter,
  connectAndReadRecords,
} from "@/lib/bluetooth/glucose-service";
import { saveBleReadings } from "@/lib/actions/bluetooth";

interface BleSyncCardProps {
  onSyncComplete?: () => void;
}

type SyncStatus = "idle" | "connecting" | "syncing" | "success" | "error";

function formatLastSync(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);

  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export function BleSyncCard({ onSyncComplete }: BleSyncCardProps) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupported(isWebBluetoothSupported());
    setDeviceName(getStoredDeviceName());
    setLastSync(getLastSyncTime());
  }, []);

  const clearMessage = useCallback((delayMs: number) => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setStatus("idle");
      setMessage(null);
    }, delayMs);
  }, []);

  const handleSync = useCallback(async () => {
    if (status === "connecting" || status === "syncing") return;

    try {
      setStatus("connecting");
      setMessage(null);

      // Always request device (Web Bluetooth requires user gesture per session)
      const device = await requestGlucoseMeter();

      setDeviceName(device.name ?? "Glucose Meter");
      setStatus("syncing");

      // Read records from device
      const readings = await connectAndReadRecords(device);

      if (readings.length === 0) {
        setStatus("success");
        setMessage("No new readings found");
        clearMessage(3000);

        return;
      }

      // Save to database
      const result = await saveBleReadings(
        readings.map((r) => ({
          value: r.value,
          unit: r.unit,
          timestamp: r.timestamp,
        })),
      );

      if (!result.success) {
        setStatus("error");
        setMessage(result.error ?? "Failed to save readings");
        clearMessage(5000);

        return;
      }

      setLastSync(new Date().toISOString());

      if (result.saved === 0) {
        setStatus("success");
        setMessage("Already up to date");
      } else {
        setStatus("success");
        setMessage(
          `${result.saved} new reading${result.saved !== 1 ? "s" : ""} synced`,
        );
      }

      clearMessage(3000);
      onSyncComplete?.();
    } catch (err) {
      // User cancelled the BLE picker — not an error
      if (err instanceof DOMException && err.name === "NotFoundError") {
        setStatus("idle");

        return;
      }

      setStatus("error");

      if (err instanceof Error) {
        if (err.message.includes("timed out")) {
          setMessage("Connection timed out. Please try again");
        } else if (err.message.includes("GATT")) {
          setMessage("Connection lost. Please try again");
        } else {
          setMessage(
            "Could not connect. Make sure your meter is nearby and Bluetooth is on",
          );
        }
      } else {
        setMessage("Could not connect. Please try again");
      }

      clearMessage(5000);
    }
  }, [status, onSyncComplete, clearMessage]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  if (!supported) return null;

  const isLoading = status === "connecting" || status === "syncing";

  return (
    <button
      className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-colors hover:bg-default-100"
      disabled={isLoading}
      type="button"
      onClick={handleSync}
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
        {isLoading ? (
          <Spinner color="primary" size="sm" />
        ) : status === "success" ? (
          <HugeiconsIcon
            className="text-success"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={18}
            strokeWidth={1.8}
          />
        ) : status === "error" ? (
          <HugeiconsIcon
            className="text-danger"
            color="currentColor"
            icon={Alert02Icon}
            size={18}
            strokeWidth={1.8}
          />
        ) : deviceName ? (
          <HugeiconsIcon
            className="text-blue-500"
            color="currentColor"
            icon={BluetoothIcon}
            size={18}
            strokeWidth={1.8}
          />
        ) : (
          <HugeiconsIcon
            className="text-blue-500"
            color="currentColor"
            icon={BluetoothNotConnectedIcon}
            size={18}
            strokeWidth={1.8}
          />
        )}
      </div>

      {message ? (
        <span
          className={`max-w-[80px] truncate text-[10px] font-medium ${
            status === "error" ? "text-danger" : "text-success"
          }`}
        >
          {message}
        </span>
      ) : (
        <span className="max-w-[80px] truncate text-xs font-medium text-default-500">
          {isLoading
            ? status === "connecting"
              ? "Connecting..."
              : "Syncing..."
            : deviceName
              ? "Sync"
              : "Connect"}
        </span>
      )}

      {!message && lastSync && status === "idle" && (
        <span className="-mt-1 text-[9px] text-default-400">
          {formatLastSync(lastSync)}
        </span>
      )}
    </button>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
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
  tryAutoReconnect,
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
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
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

  const showError = useCallback((shortMsg: string, fullDetail: string) => {
    setStatus("error");
    setMessage(shortMsg);
    setErrorDetail(fullDetail);
    setErrorModalOpen(true);
  }, []);

  const syncWithDevice = useCallback(
    async (device: BluetoothDevice) => {
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
        showError(
          "Save failed",
          `Server action error: ${result.error ?? "Unknown error"}`,
        );

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
    },
    [onSyncComplete, clearMessage, showError],
  );

  const handleSync = useCallback(async () => {
    if (status === "connecting" || status === "syncing") return;

    try {
      setStatus("connecting");
      setMessage(null);
      setErrorDetail(null);

      // Try auto-reconnect to previously paired device first
      const remembered = await tryAutoReconnect();
      const device = remembered ?? (await requestGlucoseMeter());

      await syncWithDevice(device);
    } catch (err) {
      // User cancelled the BLE picker — not an error
      if (err instanceof DOMException && err.name === "NotFoundError") {
        setStatus("idle");

        return;
      }

      // eslint-disable-next-line no-console
      console.error("BLE sync error:", err);

      const fullError =
        err instanceof Error
          ? `${err.name}: ${err.message}\n\n${err.stack ?? ""}`
          : String(err);

      const shortMsg =
        err instanceof Error
          ? err.message.length > 30
            ? err.message.slice(0, 30) + "..."
            : err.message
          : "Connection failed";

      showError(shortMsg, fullError);
    }
  }, [status, syncWithDevice, showError]);

  // Auto-sync on mount: reconnect to previously paired device without user interaction
  const autoSyncAttempted = useRef(false);

  useEffect(() => {
    if (autoSyncAttempted.current || !supported) return;
    autoSyncAttempted.current = true;

    (async () => {
      try {
        const device = await tryAutoReconnect();

        if (!device) return;

        setStatus("connecting");
        setMessage(null);
        setErrorDetail(null);
        await syncWithDevice(device);
      } catch {
        // Auto-sync is best-effort — silently fail
        setStatus("idle");
      }
    })();
  }, [supported, syncWithDevice]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  if (!supported) return null;

  const isLoading = status === "connecting" || status === "syncing";

  return (
    <>
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
            className={`max-w-[100px] truncate text-[10px] font-medium ${
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

      {/* Error detail modal */}
      <Modal
        isOpen={errorModalOpen}
        placement="center"
        onClose={() => {
          setErrorModalOpen(false);
          clearMessage(0);
        }}
      >
        <ModalContent>
          <ModalHeader className="text-danger">Sync Error</ModalHeader>
          <ModalBody>
            <pre className="whitespace-pre-wrap break-all rounded-lg bg-default-100 p-3 text-xs text-default-700">
              {errorDetail}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={() => {
                setErrorModalOpen(false);
                clearMessage(0);
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

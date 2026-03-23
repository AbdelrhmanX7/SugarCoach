# Web Bluetooth Accu-Chek Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-tap Bluetooth sync card to the home page that connects to an Accu-Chek Guide glucose meter, pulls stored readings via the Glucose Service, and auto-saves them.

**Architecture:** Client-side BLE utility parses binary GATT data into typed readings. A server action validates, deduplicates, and batch-inserts them. A self-contained React component on the home page manages the connection state and sync flow.

**Tech Stack:** Web Bluetooth API, Bluetooth Glucose Service (0x1808), Next.js Server Actions, Supabase, HeroUI, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-23-web-bluetooth-accu-chek-design.md`

---

### Task 1: Add `"accu_chek"` to the BloodSugarReading source type

**Files:**
- Modify: `types/database.ts:50`

- [ ] **Step 1: Update the source union type**

In `types/database.ts`, line 50, change:

```typescript
source: "manual" | "libre" | "dexcom" | "mysugr" | "ai_chat";
```

to:

```typescript
source: "manual" | "libre" | "dexcom" | "mysugr" | "ai_chat" | "accu_chek";
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add types/database.ts
git commit -m "feat(bluetooth): add accu_chek to BloodSugarReading source type"
```

---

### Task 2: Add Web Bluetooth type declarations

**Files:**
- Create: `types/web-bluetooth.d.ts`

The Web Bluetooth API types are not included in TypeScript's default `dom` lib and `@types/web-bluetooth` is not installed. This file must be created before any code that references `BluetoothDevice`, `BluetoothRemoteGATTCharacteristic`, `navigator.bluetooth`, etc.

- [ ] **Step 1: Create the type declarations file**

Create `types/web-bluetooth.d.ts`:

```typescript
// Web Bluetooth API type declarations
// https://webbluetoothcg.github.io/web-bluetooth/

interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
}

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(
    service: BluetoothServiceUUID,
  ): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  value: DataView | null;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name: string | null;
  gatt: BluetoothRemoteGATTServer | null;
}

interface Bluetooth extends EventTarget {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getAvailability(): Promise<boolean>;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;

interface Navigator {
  bluetooth: Bluetooth;
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add types/web-bluetooth.d.ts
git commit -m "feat(bluetooth): add Web Bluetooth API type declarations"
```

---

### Task 3: Create the BLE utility — SFLOAT parser and Glucose Measurement parser

**Files:**
- Create: `lib/bluetooth/glucose-service.ts`

This is the core BLE module. It handles Web Bluetooth feature detection, device request, GATT connection, binary parsing of the Glucose Measurement characteristic, and RACP protocol. All functions are client-side only.

- [ ] **Step 1: Create the file with types, constants, and localStorage helpers**

Create `lib/bluetooth/glucose-service.ts` with:

```typescript
// Bluetooth Glucose Service UUIDs
const GLUCOSE_SERVICE = 0x1808;
const GLUCOSE_MEASUREMENT = 0x2a18;
const RACP = 0x2a52;

// Optional services for device name
const GENERIC_ACCESS = 0x1800;
const DEVICE_INFO = 0x180a;

// Timeouts
const GATT_CONNECT_TIMEOUT_MS = 10_000;
const RACP_RESPONSE_TIMEOUT_MS = 15_000;

// Valid blood sugar ranges (matching lib/import/normalize.ts)
const VALID_RANGES = {
  "mg/dL": { min: 20, max: 600 },
  "mmol/L": { min: 1.1, max: 33.3 },
} as const;

// Glucose sample type names per Bluetooth SIG spec
const SAMPLE_TYPES: Record<number, string> = {
  1: "capillary whole blood",
  2: "capillary plasma",
  3: "venous whole blood",
  4: "venous plasma",
  5: "arterial whole blood",
  6: "arterial plasma",
  7: "undetermined whole blood",
  8: "undetermined plasma",
  9: "interstitial fluid",
  10: "control solution",
};

// Glucose sample location names per Bluetooth SIG spec
const SAMPLE_LOCATIONS: Record<number, string> = {
  1: "finger",
  2: "alternate site test",
  3: "earlobe",
  4: "control solution",
  15: "not available",
};

export interface BleGlucoseReading {
  sequenceNumber: number;
  timestamp: string; // ISO 8601
  value: number; // glucose concentration in mg/dL or mmol/L
  unit: "mg/dL" | "mmol/L";
  type: string | null;
  sampleLocation: string | null;
}

const LS_DEVICE_NAME = "ble_device_name";
const LS_LAST_SYNC = "ble_last_sync";

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator?.bluetooth;
}

export function getStoredDeviceName(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(LS_DEVICE_NAME);
}

export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(LS_LAST_SYNC);
}

export function clearStoredDevice(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_DEVICE_NAME);
  localStorage.removeItem(LS_LAST_SYNC);
}
```

- [ ] **Step 2: Add the SFLOAT parser**

Append to `lib/bluetooth/glucose-service.ts`:

```typescript
/**
 * Parse an IEEE 11073 16-bit SFLOAT from a DataView.
 * Format: 4-bit signed exponent (bits 12-15) + 12-bit signed mantissa (bits 0-11).
 * Special values: NaN (0x07FF), NRes (0x0800), +Inf (0x07FE), -Inf (0x0802), Reserved (0x0801).
 */
function parseSFLOAT(raw: number): number | null {
  // Special values
  if (raw === 0x07ff || raw === 0x0800 || raw === 0x07fe || raw === 0x0802 || raw === 0x0801) {
    return null;
  }

  // Extract 12-bit signed mantissa
  let mantissa = raw & 0x0fff;

  if (mantissa >= 0x0800) {
    mantissa = mantissa - 0x1000; // sign-extend 12-bit
  }

  // Extract 4-bit signed exponent
  let exponent = (raw >> 12) & 0x0f;

  if (exponent >= 0x08) {
    exponent = exponent - 0x10; // sign-extend 4-bit
  }

  return mantissa * Math.pow(10, exponent);
}
```

- [ ] **Step 3: Add the Glucose Measurement characteristic parser**

Append to `lib/bluetooth/glucose-service.ts`:

```typescript
/**
 * Parse a single Glucose Measurement notification DataView per Bluetooth SIG GATT spec.
 * Layout: flags(1) + seqNum(2) + baseTime(7) + [timeOffset(2)] + concentration(2) + [type+location(1)]
 */
function parseGlucoseMeasurement(dataView: DataView): BleGlucoseReading | null {
  let offset = 0;

  // Flags byte
  const flags = dataView.getUint8(offset);

  offset += 1;

  const hasTimeOffset = (flags & 0x01) !== 0;
  const hasTypeLocation = (flags & 0x02) !== 0;
  const unitIsMolL = (flags & 0x04) !== 0;

  // Sequence number (uint16 LE)
  const sequenceNumber = dataView.getUint16(offset, true);

  offset += 2;

  // Base time: year(uint16) + month + day + hour + minute + second
  const year = dataView.getUint16(offset, true);

  offset += 2;

  const month = dataView.getUint8(offset);

  offset += 1;

  const day = dataView.getUint8(offset);

  offset += 1;

  const hour = dataView.getUint8(offset);

  offset += 1;

  const minute = dataView.getUint8(offset);

  offset += 1;

  const second = dataView.getUint8(offset);

  offset += 1;

  // Optional time offset (sint16 minutes)
  let timeOffsetMinutes = 0;

  if (hasTimeOffset) {
    timeOffsetMinutes = dataView.getInt16(offset, true);
    offset += 2;
  }

  // Glucose concentration (SFLOAT)
  const rawConcentration = dataView.getUint16(offset, true);

  offset += 2;

  const sfloatValue = parseSFLOAT(rawConcentration);

  if (sfloatValue === null) return null;

  // Convert to user-facing units
  let value: number;
  let unit: "mg/dL" | "mmol/L";

  if (unitIsMolL) {
    // mol/L → mmol/L: multiply by 1000
    value = Math.round(sfloatValue * 1000 * 10) / 10;
    unit = "mmol/L";
  } else {
    // kg/L → mg/dL: multiply by 100000
    value = Math.round(sfloatValue * 100000);
    unit = "mg/dL";
  }

  // Optional type + sample location (nibble each)
  let type: string | null = null;
  let sampleLocation: string | null = null;

  if (hasTypeLocation && offset < dataView.byteLength) {
    const typeLocationByte = dataView.getUint8(offset);
    const typeNibble = typeLocationByte & 0x0f;
    const locationNibble = (typeLocationByte >> 4) & 0x0f;

    type = SAMPLE_TYPES[typeNibble] ?? null;
    sampleLocation = SAMPLE_LOCATIONS[locationNibble] ?? null;
  }

  // Build ISO timestamp
  const date = new Date(year, month - 1, day, hour, minute, second);

  if (timeOffsetMinutes !== 0) {
    date.setMinutes(date.getMinutes() + timeOffsetMinutes);
  }

  const timestamp = date.toISOString();

  // Validate range
  const range = VALID_RANGES[unit];

  if (value < range.min || value > range.max) return null;

  // Reject future timestamps (allow 24h buffer for timezone)
  const futureLimit = new Date();

  futureLimit.setHours(futureLimit.getHours() + 24);
  if (date > futureLimit) return null;

  return { sequenceNumber, timestamp, value, unit, type, sampleLocation };
}
```

- [ ] **Step 4: Add `requestGlucoseMeter()` and `connectAndReadRecords()`**

Append to `lib/bluetooth/glucose-service.ts`:

```typescript
/**
 * Open the browser BLE device picker filtered to glucose meters.
 * Saves device name to localStorage.
 */
export async function requestGlucoseMeter(): Promise<BluetoothDevice> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [GLUCOSE_SERVICE] }],
    optionalServices: [GENERIC_ACCESS, DEVICE_INFO],
  });

  if (device.name) {
    localStorage.setItem(LS_DEVICE_NAME, device.name);
  }

  return device;
}

/**
 * Connect to a glucose meter, read all stored records via RACP, and return parsed readings.
 * Always disconnects and cleans up listeners in the finally block.
 */
export async function connectAndReadRecords(
  device: BluetoothDevice,
): Promise<BleGlucoseReading[]> {
  if (!device.gatt) {
    throw new Error("Device does not support GATT");
  }

  const readings: BleGlucoseReading[] = [];
  let glucoseMeasurement: BluetoothRemoteGATTCharacteristic | null = null;
  let racp: BluetoothRemoteGATTCharacteristic | null = null;

  // Named listeners so they can be removed in cleanup
  const onGlucoseMeasurement = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;

    if (target.value) {
      const parsed = parseGlucoseMeasurement(target.value);

      if (parsed) readings.push(parsed);
    }
  };

  let onRacpResponse: ((event: Event) => void) | null = null;

  try {
    // Step 1: Connect with timeout
    const server = await Promise.race([
      device.gatt.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out")), GATT_CONNECT_TIMEOUT_MS),
      ),
    ]);

    // Step 2: Get service and characteristics
    const service = await server.getPrimaryService(GLUCOSE_SERVICE);

    glucoseMeasurement = await service.getCharacteristic(GLUCOSE_MEASUREMENT);
    racp = await service.getCharacteristic(RACP);

    // Step 3: Subscribe to Glucose Measurement notifications
    await glucoseMeasurement.startNotifications();
    glucoseMeasurement.addEventListener("characteristicvaluechanged", onGlucoseMeasurement);

    // Step 4: Subscribe to RACP indications and set up completion promise
    await racp.startNotifications();

    const racpComplete = new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, RACP_RESPONSE_TIMEOUT_MS);

      onRacpResponse = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;

        if (target.value) {
          const opcode = target.value.getUint8(0);

          // Opcode 6 = "Response" — RACP transfer complete
          if (opcode === 6) {
            clearTimeout(timeout);
            resolve();
          }
        }
      };

      racp!.addEventListener("characteristicvaluechanged", onRacpResponse);
    });

    // Step 5: Write RACP "Report All Stored Records" command
    await racp.writeValue(new Uint8Array([0x01, 0x01]));

    // Step 6: Wait for completion (RACP response or timeout)
    await racpComplete;

    // Step 7: Save sync timestamp
    localStorage.setItem(LS_LAST_SYNC, new Date().toISOString());
  } finally {
    // Remove event listeners
    if (glucoseMeasurement) {
      glucoseMeasurement.removeEventListener("characteristicvaluechanged", onGlucoseMeasurement);
      try { await glucoseMeasurement.stopNotifications(); } catch { /* already disconnected */ }
    }
    if (racp && onRacpResponse) {
      racp.removeEventListener("characteristicvaluechanged", onRacpResponse);
      try { await racp.stopNotifications(); } catch { /* already disconnected */ }
    }

    // Always disconnect to avoid dangling BLE connections
    device.gatt?.disconnect();
  }

  return readings;
}
```

- [ ] **Step 5: Verify lint passes**

Run: `yarn lint`
Expected: no errors in `lib/bluetooth/glucose-service.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/bluetooth/glucose-service.ts
git commit -m "feat(bluetooth): add BLE Glucose Service utility with SFLOAT/GATT parsing"
```

---

### Task 4: Create the server action — `saveBleReadings`

**Files:**
- Create: `lib/actions/bluetooth.ts`

Reference patterns: `lib/actions/log.ts` (auth + gamification), `lib/import/normalize.ts` (validation ranges), `app/api/import/route.ts` (batch insert of 500).

- [ ] **Step 1: Create the server action**

Create `lib/actions/bluetooth.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { processLogReward } from "@/lib/actions/gamification";

// Valid blood sugar ranges (matching lib/import/normalize.ts)
const VALID_RANGES = {
  "mg/dL": { min: 20, max: 600 },
  "mmol/L": { min: 1.1, max: 33.3 },
} as const;

type BleReadingInput = {
  value: number;
  unit: "mg/dL" | "mmol/L";
  timestamp: string;
};

type SaveBleResult = {
  success: boolean;
  saved: number;
  duplicates: number;
  error?: string;
};

function isValidReading(reading: unknown): reading is BleReadingInput {
  if (!reading || typeof reading !== "object") return false;

  const r = reading as Record<string, unknown>;

  if (typeof r.value !== "number" || isNaN(r.value)) return false;
  if (r.unit !== "mg/dL" && r.unit !== "mmol/L") return false;
  if (typeof r.timestamp !== "string") return false;

  const range = VALID_RANGES[r.unit as "mg/dL" | "mmol/L"];

  if (r.value < range.min || r.value > range.max) return false;

  const date = new Date(r.timestamp);

  if (isNaN(date.getTime())) return false;

  // Reject future dates (24h buffer for timezone)
  const futureLimit = new Date();

  futureLimit.setHours(futureLimit.getHours() + 24);

  return date <= futureLimit;
}

export async function saveBleReadings(
  readings: BleReadingInput[],
): Promise<SaveBleResult> {
  try {
    if (!Array.isArray(readings)) {
      return { success: false, saved: 0, duplicates: 0, error: "Invalid input" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, saved: 0, duplicates: 0, error: "Unauthorized" };
    }

    // Validate readings (also acts as runtime type guard)
    const validReadings = readings.filter(isValidReading);

    if (validReadings.length === 0) {
      return { success: true, saved: 0, duplicates: 0 };
    }

    // Find date range for dedup query
    const timestamps = validReadings.map((r) => new Date(r.timestamp).getTime());
    const minTime = new Date(Math.min(...timestamps)).toISOString();
    const maxTime = new Date(Math.max(...timestamps)).toISOString();

    // Fetch existing readings in range for deduplication
    const { data: existing } = await supabase
      .from("blood_sugar_readings")
      .select("reading_time, value, unit")
      .eq("user_id", user.id)
      .eq("source", "accu_chek")
      .gte("reading_time", minTime)
      .lte("reading_time", maxTime);

    const existingKeys = new Set(
      (existing ?? []).map(
        (r: { reading_time: string; value: number; unit: string }) =>
          `${r.reading_time}|${r.value}|${r.unit}`,
      ),
    );

    // Filter out duplicates
    const newReadings = validReadings.filter(
      (r) => !existingKeys.has(`${r.timestamp}|${r.value}|${r.unit}`),
    );

    const duplicates = validReadings.length - newReadings.length;

    if (newReadings.length === 0) {
      return { success: true, saved: 0, duplicates };
    }

    // Batch insert (500 per batch, matching import pattern)
    const BATCH_SIZE = 500;

    for (let i = 0; i < newReadings.length; i += BATCH_SIZE) {
      const batch = newReadings.slice(i, i + BATCH_SIZE).map((r) => ({
        user_id: user.id,
        value: r.value,
        unit: r.unit,
        reading_time: r.timestamp,
        source: "accu_chek" as const,
        context: null,
        notes: null,
      }));

      const { error } = await supabase
        .from("blood_sugar_readings")
        .insert(batch);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error inserting BLE readings batch:", error);

        return {
          success: false,
          saved: 0,
          duplicates,
          error: "Failed to save readings",
        };
      }
    }

    // Award gamification reward
    processLogReward("blood_sugar").catch(() => {});

    return { success: true, saved: newReadings.length, duplicates };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error saving BLE readings:", err);

    return {
      success: false,
      saved: 0,
      duplicates: 0,
      error: "Something went wrong",
    };
  }
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Verify lint passes**

Run: `yarn lint`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/actions/bluetooth.ts
git commit -m "feat(bluetooth): add saveBleReadings server action with validation and dedup"
```

---

### Task 5: Create the BLE sync card component

**Files:**
- Create: `components/home/ble-sync-card.tsx`

Reference patterns: `app/(dashboard)/home/page.tsx` (quick-access card styling), `components/home/meal-timer.tsx` (inline status pattern).

The component is self-contained — it manages BLE connection state, triggers sync, displays inline status messages, and calls `onSyncComplete` to refresh the dashboard.

- [ ] **Step 1: Create the component**

Create `components/home/ble-sync-card.tsx`:

```typescript
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
        setMessage(`${result.saved} new reading${result.saved !== 1 ? "s" : ""} synced`);
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
          setMessage("Could not connect. Make sure your meter is nearby and Bluetooth is on");
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
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Verify lint passes**

Run: `yarn lint`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/home/ble-sync-card.tsx
git commit -m "feat(bluetooth): add BleSyncCard component for home page"
```

---

### Task 6: Integrate the BLE sync card into the home page

**Files:**
- Modify: `app/(dashboard)/home/page.tsx`

The card is placed alongside the existing quick-access items. It's conditionally rendered — hidden on unsupported browsers, so the quick-access row keeps its current items.

- [ ] **Step 1: Add the BleSyncCard import**

In `app/(dashboard)/home/page.tsx`, add to the imports from `@/components/home/`:

```typescript
import { BleSyncCard } from "@/components/home/ble-sync-card";
```

- [ ] **Step 2: Add the BleSyncCard to the quick-access area**

In `app/(dashboard)/home/page.tsx`, find the quick-access rendering section (the `{quickAccess.map(...)}` block inside the `{/* Quick Access row */}` div). After the closing of that map block, but still inside the same flex container div, add the BleSyncCard:

```typescript
<BleSyncCard onSyncComplete={fetchData} />
```

So the Quick Access row div becomes:

```tsx
{/* Quick Access row */}
<div className="flex items-center justify-around">
  {quickAccess.map((item) => {
    // ... existing code unchanged ...
  })}
  <BleSyncCard onSyncComplete={fetchData} />
</div>
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Verify lint passes**

Run: `yarn lint`
Expected: no errors

- [ ] **Step 5: Verify build succeeds**

Run: `yarn build`
Expected: successful build with no errors

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/home/page.tsx
git commit -m "feat(bluetooth): integrate BLE sync card into home page quick-access"
```

---

### Task 7: Manual integration test

**Files:** None (testing only)

Since Web Bluetooth requires a real BLE device and a Chromium browser, this task is a manual verification checklist.

- [ ] **Step 1: Verify build succeeds**

Run: `yarn build`
Expected: successful build

- [ ] **Step 2: Start dev server and test in Chrome**

Run: `yarn dev`

Open `http://localhost:3000/home` in Chrome.

Verify:
1. The quick-access row shows the BLE "Connect" card (if on Chrome) or hides it (if on Firefox/Safari)
2. Clicking "Connect" opens the browser's Bluetooth device picker
3. If no BLE device nearby, cancelling the picker returns card to idle silently
4. If an Accu-Chek Guide is available: pairing and syncing reads records, saves them, card shows "X new readings synced", dashboard chart/stats refresh

- [ ] **Step 3: Verify unsupported browser behavior**

Open `http://localhost:3000/home` in Firefox or Safari.

Verify: The BLE sync card is not visible. Quick-access row shows only the original 4 items.

- [ ] **Step 4: Final commit with any lint/type fixes**

If any fixes were needed during testing:

```bash
git add -A
git commit -m "fix(bluetooth): address integration test issues"
```

# Web Bluetooth Accu-Chek Guide Integration

**Date:** 2026-03-23
**Status:** Approved

## Summary

Add a one-tap Bluetooth sync card to the home page that connects to an Accu-Chek Guide glucose meter via the Web Bluetooth API, pulls stored readings using the standard Bluetooth Glucose Service (UUID `0x1808`), and auto-saves them to the database.

## Constraints

- **Web Bluetooth requires a user gesture** — `navigator.bluetooth.requestDevice()` must be called from a click/tap handler. True auto-reconnect on page load is not possible.
- **Browser support** — Chrome (desktop + Android), Edge, Opera only. No Safari, Firefox, or any iOS browser. The feature uses `navigator.bluetooth` detection and is hidden on unsupported browsers.
- **Device** — Accu-Chek Guide / Guide Me. These advertise the standard Bluetooth Glucose Service.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `lib/bluetooth/glucose-service.ts` | Client-side BLE utility — connect, read GATT, parse Glucose Measurement characteristic |
| `lib/actions/bluetooth.ts` | Server action — deduplicate and batch-insert readings |
| `components/home/ble-sync-card.tsx` | Home page card component — manages connection state, triggers sync |

### Modified Files

| File | Change |
|------|--------|
| `app/(dashboard)/home/page.tsx` | Add BLE sync card to quick-access area, pass `fetchData` for post-sync refresh |
| `types/database.ts` | Add `"accu_chek"` to `BloodSugarReading.source` union type |

## Detailed Design

### 1. BLE Utility — `lib/bluetooth/glucose-service.ts`

Client-side only (`"use client"` not needed since it's a plain module imported by a client component).

#### Types

```typescript
export interface BleGlucoseReading {
  sequenceNumber: number;
  timestamp: string;       // ISO 8601
  value: number;           // glucose concentration
  unit: "mg/dL" | "mmol/L";
  type: string | null;     // e.g. "capillary whole blood"
  sampleLocation: string | null;
}
```

#### Functions

**`isWebBluetoothSupported(): boolean`**
Returns `!!navigator?.bluetooth`.

**`getStoredDeviceName(): string | null`**
Reads `ble_device_name` from localStorage.

**`getLastSyncTime(): string | null`**
Reads `ble_last_sync` from localStorage.

**`clearStoredDevice(): void`**
Removes `ble_device_name` and `ble_last_sync` from localStorage.

**`requestGlucoseMeter(): Promise<BluetoothDevice>`**
Calls `navigator.bluetooth.requestDevice()` with:
- `filters: [{ services: [0x1808] }]` — Glucose Service
- `optionalServices: [0x1800, 0x180A]` — Generic Access + Device Information (for device name)

Saves `device.name` to localStorage as `ble_device_name`. Returns the `BluetoothDevice`.

**`connectAndReadRecords(device: BluetoothDevice): Promise<BleGlucoseReading[]>`**

Wrapped in a `try/finally` block — `finally` always calls `device.gatt?.disconnect()` to avoid dangling BLE connections on error.

1. Connect to GATT server: `device.gatt.connect()` with a 10-second timeout (race against `setTimeout` reject)
2. Get Glucose Service: `server.getPrimaryService(0x1808)`
3. Get Glucose Measurement characteristic: `service.getCharacteristic(0x2A18)`
4. Get RACP characteristic: `service.getCharacteristic(0x2A52)`
5. Subscribe to Glucose Measurement notifications: `glucoseMeasurement.startNotifications()` + `addEventListener('characteristicvaluechanged', ...)`
6. Subscribe to RACP indications: `racp.startNotifications()` + listen for `characteristicvaluechanged` to detect the response code (opcode 6)
7. Each Glucose Measurement notification delivers a `DataView` — parse it (see Parsing section below)
8. Write RACP "Report All Stored Records" command: `racp.writeValue(new Uint8Array([0x01, 0x01]))` (opcode=1: report stored records, operator=1: all records)
9. Wait for RACP response indication (opcode 6 is the primary completion signal). Fallback timeout: 15 seconds after RACP write (Accu-Chek Guide stores up to 720 records, which may take time over BLE)
10. Stop notifications, disconnect, return collected readings
11. Save current ISO timestamp to localStorage as `ble_last_sync`

#### Glucose Measurement Parsing

The characteristic value is a binary `DataView` per Bluetooth SIG GATT spec:

| Byte(s) | Field | Notes |
|---------|-------|-------|
| 0 | Flags | Bit 0: time offset present, Bit 1: concentration type+location present, Bit 2: unit (0=kg/L, 1=mol/L), Bit 4: context follows |
| 1-2 | Sequence Number | uint16 LE |
| 3-9 | Base Time | year(uint16) + month + day + hour + minute + second |
| 10-11 | Time Offset (optional) | sint16 minutes, if flags bit 0 set |
| next 2 | Glucose Concentration | SFLOAT (IEEE 11073 16-bit float) |
| next 1 | Type + Sample Location (optional) | nibble each, if flags bit 1 set |

**SFLOAT parsing**: `mantissa = value & 0x0FFF` (sign-extend 12-bit), `exponent = value >> 12` (sign-extend 4-bit), `result = mantissa * 10^exponent`. Unit conversion: if flags bit 2 is 0, value is in kg/L — multiply by 100000 to get mg/dL. If bit 2 is 1, value is in mol/L — multiply by 1000 to get mmol/L.

### 2. Server Action — `lib/actions/bluetooth.ts`

```typescript
"use server"

export async function saveBleReadings(
  readings: { value: number; unit: "mg/dL" | "mmol/L"; timestamp: string }[]
): Promise<{ success: boolean; saved: number; duplicates: number; error?: string }>
```

1. Create Supabase server client (`await createClient()`), authenticate user
2. Validate incoming readings: filter to valid ranges (20–600 mg/dL or 1.1–33.3 mmol/L), reject future timestamps — same rules as `normalizeReadings()` in `lib/import/normalize.ts`
3. Query existing `blood_sugar_readings` where `source = 'accu_chek'` and `reading_time` is within the min/max range of incoming readings — fetch into a Set of `"${reading_time}|${value}|${unit}"` keys (matching the dedup pattern in `normalize.ts`)
4. Filter incoming readings to only those not in the Set
5. Batch insert (500 per batch, matching existing import pattern) with fields:
   - `user_id`, `value`, `unit`, `reading_time` (from timestamp), `source: "accu_chek"`, `context: null`, `notes: null`
6. Call `processLogReward("blood_sugar")` once after successful insert to award XP and update streaks (matching the pattern in `lib/actions/log.ts`)
7. Return `{ success: true, saved: newCount, duplicates: totalCount - newCount }`

### 3. Component — `components/home/ble-sync-card.tsx`

A self-contained `"use client"` component.

**Props:**
```typescript
interface BleSyncCardProps {
  onSyncComplete?: () => void;  // called after successful save to refresh dashboard
}
```

**Internal State:**
- `status`: `"idle" | "connecting" | "syncing" | "success" | "error"`
- `deviceName`: from `getStoredDeviceName()`
- `lastSync`: from `getLastSyncTime()`
- `error`: error message string

**Render Logic:**
- If `!isWebBluetoothSupported()` → return `null` (card hidden)
- If no stored device → show "Connect Meter" button with Bluetooth icon
- If stored device → show "Sync {deviceName}" with last sync time subtitle
- During connecting/syncing → spinner overlay on the card
- On success → inline status text in card: "{N} new readings synced" (or "Already up to date" if 0), auto-clears after 3 seconds
- On error → inline status text in card with error message, auto-clears after 5 seconds

**Sync Flow (onClick):**
1. If no stored device: call `requestGlucoseMeter()` to open picker, then `connectAndReadRecords(device)`
2. If stored device: call `requestGlucoseMeter()` again (Web Bluetooth requires fresh request per session, but the browser remembers prior permission grants and may auto-accept)
3. Pass readings to `saveBleReadings()` server action
4. Show inline result status, call `onSyncComplete()`

**Visual Style:**
Matches the existing quick-access card pattern — icon in a colored circle (`bg-blue-500/10`, `text-blue-500`), label below. Uses `BluetoothIcon` from `@hugeicons/core-free-icons`.

### 4. Home Page Integration — `app/(dashboard)/home/page.tsx`

Add to the `quickAccess` array:
```typescript
{
  key: "bluetooth",
  label: "Sync",
  icon: BluetoothIcon,
  color: "text-blue-500",
  bg: "bg-blue-500/10",
}
```

But instead of rendering the generic button for this key, render `<BleSyncCard onSyncComplete={fetchData} />`. The card handles its own click behavior internally.

The card is conditionally rendered — if Web Bluetooth is not supported, it simply doesn't appear and the quick access row has 4 items as before.

### 5. Type Changes — `types/database.ts`

Add `"accu_chek"` to the `source` field type on the `BloodSugarReading` interface:

```typescript
source: "manual" | "libre" | "dexcom" | "mysugr" | "ai_chat" | "accu_chek"
```

No database migration needed — the `source` column is stored as `text` in PostgreSQL.

## Data Flow

```
User taps "Sync" card on home page
  |
  v
requestGlucoseMeter() — browser BLE picker (first time) or re-request
  |
  v
connectAndReadRecords(device) — GATT connect → subscribe to notifications → RACP "report all"
  |
  v
Parse each Glucose Measurement notification → BleGlucoseReading[]
  |
  v
saveBleReadings() server action — deduplicate → batch insert to blood_sugar_readings
  |
  v
Card shows "5 new readings synced" — fetchData() refreshes dashboard stats + chart
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Browser doesn't support Web Bluetooth | Card not rendered (feature detection) |
| User cancels BLE picker | Silent — status returns to idle |
| Device out of range / BLE off | Inline error: "Could not connect. Make sure your meter is nearby and Bluetooth is on" |
| GATT connection drops mid-sync | Inline error: "Connection lost. Please try again" |
| GATT connection timeout (10s) | Inline error: "Connection timed out. Please try again" |
| RACP timeout (no records in 15s) | Resolve with empty array, inline status: "No new readings found" |
| Server action failure | Inline error: "Failed to save readings. Please try again" |
| All readings are duplicates | Inline status: "Already up to date" |
| Invalid readings (out of range) | Silently filtered out during validation, only valid readings saved |

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome (desktop) | Yes |
| Chrome (Android) | Yes |
| Edge | Yes |
| Opera | Yes |
| Safari (macOS/iOS) | No |
| Firefox | No |
| Any iOS browser | No (WebKit engine limitation) |

## Out of Scope

- Continuous real-time streaming (Accu-Chek Guide stores readings, not a CGM)
- Background sync / service worker BLE (not supported by Web Bluetooth spec)
- Glucose Context characteristic (`0x2A34`) — not needed for basic readings
- Other BLE glucose meters (OneTouch, Contour) — same Glucose Service UUID, could work but untested
- Family member syncing — readings always saved under the authenticated user, no mechanism to assign to a child's account

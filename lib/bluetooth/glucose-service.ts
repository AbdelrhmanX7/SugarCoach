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
const LS_DEVICE_ID = "ble_device_id";
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
  localStorage.removeItem(LS_DEVICE_ID);
  localStorage.removeItem(LS_LAST_SYNC);
}

/**
 * Parse an IEEE 11073 16-bit SFLOAT from a DataView.
 * Format: 4-bit signed exponent (bits 12-15) + 12-bit signed mantissa (bits 0-11).
 * Special values: NaN (0x07FF), NRes (0x0800), +Inf (0x07FE), -Inf (0x0802), Reserved (0x0801).
 */
function parseSFLOAT(raw: number): number | null {
  // Special values
  if (
    raw === 0x07ff ||
    raw === 0x0800 ||
    raw === 0x07fe ||
    raw === 0x0802 ||
    raw === 0x0801
  ) {
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

/**
 * Check if the browser supports reconnecting to previously paired devices
 * (Chrome 85+ via navigator.bluetooth.getDevices).
 */
export function supportsAutoReconnect(): boolean {
  return isWebBluetoothSupported() && !!navigator.bluetooth.getDevices;
}

/**
 * Try to reconnect to a previously paired glucose meter without showing the picker.
 * Uses navigator.bluetooth.getDevices() (Chrome 85+) to find the stored device
 * and watchAdvertisements() to detect when it's in range.
 *
 * Returns the device if found and connectable, or null if auto-reconnect isn't
 * possible (device not in range, API not supported, no stored device).
 */
export async function tryAutoReconnect(): Promise<BluetoothDevice | null> {
  if (!supportsAutoReconnect()) return null;

  const storedId =
    typeof window !== "undefined" ? localStorage.getItem(LS_DEVICE_ID) : null;

  if (!storedId) return null;

  const devices = await navigator.bluetooth.getDevices!();
  const device = devices.find((d) => d.id === storedId);

  if (!device || !device.gatt) return null;

  // If the device supports watchAdvertisements, use it to detect proximity
  if (device.watchAdvertisements) {
    const controller = new AbortController();

    try {
      // Set up listener first, then start scanning
      const advertisementPromise = new Promise<BluetoothDevice>((resolve) => {
        device.addEventListener(
          "advertisementreceived",
          () => {
            controller.abort();
            resolve(device);
          },
          { once: true },
        );
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => {
          controller.abort();
          resolve(null);
        }, 5_000),
      );

      // Start watching — this triggers advertisementreceived events
      await device.watchAdvertisements({ signal: controller.signal });

      const found = await Promise.race([advertisementPromise, timeoutPromise]);

      if (found) return found;
    } catch {
      // watchAdvertisements not supported or failed — try direct connect
    }
  }

  // Fallback: attempt direct GATT connect (works if device is already bonded at OS level)
  try {
    await Promise.race([
      device.gatt.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Auto-reconnect timed out")),
          GATT_CONNECT_TIMEOUT_MS,
        ),
      ),
    ]);
    device.gatt.disconnect(); // disconnect — we just tested reachability

    return device;
  } catch {
    return null;
  }
}

/**
 * Open the browser BLE device picker filtered to glucose meters.
 * Saves device name and ID to localStorage for auto-reconnect.
 */
export async function requestGlucoseMeter(): Promise<BluetoothDevice> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [GLUCOSE_SERVICE] }],
    optionalServices: [GENERIC_ACCESS, DEVICE_INFO],
  });

  if (device.name) {
    localStorage.setItem(LS_DEVICE_NAME, device.name);
  }
  localStorage.setItem(LS_DEVICE_ID, device.id);

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
        setTimeout(
          () => reject(new Error("Connection timed out")),
          GATT_CONNECT_TIMEOUT_MS,
        ),
      ),
    ]);

    // Step 2: Get service and characteristics
    const service = await server.getPrimaryService(GLUCOSE_SERVICE);

    glucoseMeasurement = await service.getCharacteristic(GLUCOSE_MEASUREMENT);
    racp = await service.getCharacteristic(RACP);

    // Step 3: Subscribe to Glucose Measurement notifications
    await glucoseMeasurement.startNotifications();
    glucoseMeasurement.addEventListener(
      "characteristicvaluechanged",
      onGlucoseMeasurement,
    );

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
      glucoseMeasurement.removeEventListener(
        "characteristicvaluechanged",
        onGlucoseMeasurement,
      );
      try {
        await glucoseMeasurement.stopNotifications();
      } catch {
        /* already disconnected */
      }
    }
    if (racp && onRacpResponse) {
      racp.removeEventListener("characteristicvaluechanged", onRacpResponse);
      try {
        await racp.stopNotifications();
      } catch {
        /* already disconnected */
      }
    }

    // Always disconnect to avoid dangling BLE connections
    device.gatt?.disconnect();
  }

  return readings;
}

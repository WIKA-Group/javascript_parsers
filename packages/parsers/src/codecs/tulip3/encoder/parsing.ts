// Import lookup tables from utils
import {
  protocolDataTypeLookup,
  unitsLookup,
} from '../lookups'

// ============================================================================
// COMMON ENCODING FUNCTIONS
// Used across multiple register types (identification, configuration, etc.)
// ============================================================================

/**
 * Converts an unsigned 8-bit integer to a single byte tuple
 * @param value Unsigned 8-bit integer (0-255)
 * @returns Tuple containing exactly 1 byte
 */
export function uint8ToIntTuple1(value: number): [number] {
  if (value < 0 || value > 255 || !Number.isInteger(value)) {
    throw new TypeError(`Value must be an integer between 0 and 255, got: ${value}`)
  }
  return [value & 0xFF]
}

/**
 * Converts a signed 8-bit integer to a single byte tuple
 * @param value Signed 8-bit integer (-128 to 127)
 * @returns Tuple containing exactly 1 byte
 */
export function int8ToIntTuple1(value: number): [number] {
  if (value < -128 || value > 127 || !Number.isInteger(value)) {
    throw new TypeError(`Value must be an integer between -128 and 127, got: ${value}`)
  }
  return [(value < 0 ? value + 256 : value) & 0xFF]
}

/**
 * Converts an unsigned 16-bit integer to a 2-byte tuple (big-endian)
 * @param value Unsigned 16-bit integer (0-65535)
 * @returns Tuple containing exactly 2 bytes
 */
export function uint16ToIntTuple2(value: number): [number, number] {
  if (value < 0 || value > 65535 || !Number.isInteger(value)) {
    throw new TypeError(`Value must be an integer between 0 and 65535, got: ${value}`)
  }
  return [
    (value >> 8) & 0xFF,
    value & 0xFF,
  ]
}

/**
 * Converts an unsigned 32-bit integer to a 4-byte tuple (big-endian)
 * @param value Unsigned 32-bit integer (0-4294967295)
 * @returns Tuple containing exactly 4 bytes
 */
export function uint32ToIntTuple4(value: number): [number, number, number, number] {
  if (value < 0 || value > 4294967295 || !Number.isInteger(value)) {
    throw new TypeError(`Value must be an integer between 0 and 4294967295, got: ${value}`)
  }
  return [
    (value >> 24) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 8) & 0xFF,
    value & 0xFF,
  ]
}

/**
 * Converts a 32-bit float to a 4-byte tuple (big-endian, IEEE-754)
 * @param value 32-bit floating point number
 * @returns Tuple containing exactly 4 bytes
 */
export function float32ToIntTuple4(value: number): [number, number, number, number] {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Value must be a finite number, got: ${value}`)
  }
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setFloat32(0, value, false) // false = big-endian
  return [
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  ]
}

export function numberToIntTuple4(value: number): [number, number, number, number] {
  return float32ToIntTuple4(value)
}

/**
 * Converts a boolean value to a single byte
 * @param value Boolean value
 * @returns Tuple containing exactly 1 byte (0 = false, 1 = true)
 */
export function booleanToIntTuple1(value: boolean): [number] {
  return [value ? 1 : 0]
}

// ============================================================================
// IDENTIFICATION-SPECIFIC ENCODING FUNCTIONS
// Used primarily in identification registers
// ============================================================================

/**
 * Converts a unit string to a single byte using the lookup table
 * @param value Unit string from the lookup table
 * @returns Tuple containing exactly 1 byte with unit value
 * @throws Error if the value is not found in the lookup table
 */
export function unitToIntTuple1(value: string): [number] {
  const entry = Object.entries(unitsLookup).find(([_key, val]) => val === value)
  if (!entry) {
    throw new TypeError(`Unknown unit string: "${value}". Must be one of: ${Object.values(unitsLookup).join(', ')}`)
  }
  return [Number.parseInt(entry[0], 10)]
}

// ============================================================================
// CONFIGURATION-SPECIFIC ENCODING FUNCTIONS
// Used primarily in configuration registers
// ============================================================================

/**
 * Converts a sample channel bit field mapping to a single byte
 * @param channels Object mapping channel names to boolean sampling status
 * @returns Tuple containing exactly 1 byte with channel sampling flags
 */
export function sampleChannelsToIntTuple1(channels: Record<string, boolean>): [number] {
  let value = 0
  // Bit mapping: Bit 7 = channel 8, Bit 6 = channel 7, ..., Bit 0 = channel 1
  for (let i = 1; i <= 8; i++) {
    if (channels[`channel${i}`]) {
      value |= (1 << (i - 1))
    }
  }
  return [value & 0xFF]
}

/**
 * Converts a protocol data type string to a single byte using the lookup table
 * @param value Protocol data type string
 * @returns Tuple containing exactly 1 byte with protocol data type value
 * @throws Error if the value is not found in the lookup table
 */
export function protocolDataTypeToIntTuple1(value: string): [number] {
  const entry = Object.entries(protocolDataTypeLookup).find(([_key, val]) => val === value)
  if (!entry) {
    throw new TypeError(`Unknown protocol data type: "${value}". Must be one of: ${Object.values(protocolDataTypeLookup).join(', ')}`)
  }
  return [Number.parseInt(entry[0], 10)]
}

/**
 * Converts a process alarm enabled bit field mapping to a single byte
 * @param alarms Object mapping alarm types to boolean enabled status
 * @returns Tuple containing exactly 1 byte with alarm enable flags
 */
export function processAlarmEnabledToIntTuple1(alarms: Record<string, boolean>): [number] {
  let value = 0
  if (alarms.lowThreshold)
    value |= 0x80 // Bit 7
  if (alarms.highThreshold)
    value |= 0x40 // Bit 6
  if (alarms.fallingSlope)
    value |= 0x20 // Bit 5
  if (alarms.risingSlope)
    value |= 0x10 // Bit 4
  if (alarms.lowThresholdWithDelay)
    value |= 0x08 // Bit 3
  if (alarms.highThresholdWithDelay)
    value |= 0x04 // Bit 2
  // Bit 1 and 0 are RFU (Reserved for Future Use)
  return [value & 0xFF]
}

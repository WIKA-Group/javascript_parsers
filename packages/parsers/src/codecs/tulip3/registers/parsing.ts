// Import lookup tables from utils
import nstr from 'nstr'
import {
  measurandLookup,
  productSubIdLookup,
  protocolDataTypeLookup,
  unitsLookup,
} from '../lookups'

// ============================================================================
// COMMON PARSING FUNCTIONS
// Used across multiple register types (identification, configuration, etc.)
// ============================================================================

/**
 * Converts an array of integers to an ASCII string
 * @param data Array of integer values representing ASCII characters
 * @returns ASCII string representation
 */
export function intArrayToASCII(data: number[]): string {
  return String.fromCharCode(...data)
}

/**
 * Converts a single byte tuple to an unsigned 8-bit integer
 * @param data Tuple containing exactly 1 byte
 * @returns Unsigned 8-bit integer (0-255)
 */
export function intTuple1ToUInt8(data: [number]): number {
  return data[0] & 0xFF
}

/**
 * Converts a 2-byte tuple to an unsigned 16-bit integer (big-endian)
 * @param data Tuple containing exactly 2 bytes
 * @returns Unsigned 16-bit integer (0-65535)
 */
export function intTuple2ToUInt16(data: [number, number]): number {
  return ((data[0] & 0xFF) << 8) | (data[1] & 0xFF)
}

/**
 * Converts a 4-byte tuple to a 32-bit IEEE 754 float (big-endian)
 * @param data Tuple containing exactly 4 bytes
 * @returns 32-bit floating point number (raw IEEE-754 value).
 *
 * Note: this function returns the raw float value produced by the
 * underlying DataView and does not attempt to correct floating-point
 * precision artifacts (for example: 0.30000000000000004). If you need
 * a UI-friendly, rounded number, use {@link intTuple4ToFloat32WithThreshold}.
 */
export function intTuple4ToFloat32(data: [number, number, number, number]): number {
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setUint8(0, data[0] & 0xFF)
  view.setUint8(1, data[1] & 0xFF)
  view.setUint8(2, data[2] & 0xFF)
  view.setUint8(3, data[3] & 0xFF)
  return view.getFloat32(0)
}

/**
 * Converts a 4-byte tuple to a 32-bit IEEE 754 float and returns a
 * cleaned numeric value suitable for UI display.
 *
 * Uses `nstr` to automatically detect and remove common floating-point
 * precision artifacts (for example: 0.30000000000000004 → "0.3").
 *
 * @param data Tuple containing exactly 4 bytes
 * @param threshold Non-negative integer controlling artifact detection sensitivity (default: 3)
 * @returns Cleaned numeric value (parsed from `nstr` output)
 */
export function intTuple4ToFloat32WithThreshold(data: [number, number, number, number], threshold = 3): number {
  threshold = Math.max(0, Math.floor(threshold))
  const value = intTuple4ToFloat32(data)
  // Use `nstr` to automatically detect and fix common floating-point
  // precision artifacts (repeating or spurious digits) and return a
  // cleaned numeric value. `threshold` controls the detection behavior
  // (non-negative integer); higher values make the function less eager
  // to modify trailing digits. See `nstr` for details — it converts a
  // number to a string with smart precision detection and here we parse
  // that back to a Number.
  return Number.parseFloat(nstr(value, { threshold }))
}

/**
 * Converts a 3-byte tuple to a semantic version string
 * @param data Tuple containing exactly 3 bytes [major, minor, patch]
 * @returns Semantic version string in format "major.minor.patch"
 */
export function intTuple3ToSemVer(data: [number, number, number]): string {
  return `${data[0]}.${data[1]}.${data[2]}`
}

/**
 * Converts a 3-byte tuple to a Date object
 * @param data Tuple containing exactly 3 bytes [year_offset, month, day]
 * @returns Date object (year is calculated as data[0] + 2000)
 */
export function intTuple3ToDate(data: [number, number, number]): Date {
  const year = data[0] + 2000 // Assuming the year is in the range 2000-2099
  const month = data[1].toString().padStart(2, '0')
  const day = data[2].toString().padStart(2, '0')
  return new Date(`${year}-${month}-${day}`)
}

/**
 * Converts a single byte to a boolean value
 * @param data Tuple containing exactly 1 byte
 * @returns Boolean value (0 = false, non-zero = true)
 */
export function intTuple1ToBoolean(data: [number]): boolean {
  return Boolean(data[0] & 0xFF)
}

/**
 * Converts a 4-byte tuple to an unsigned 32-bit integer (big-endian)
 * @param data Tuple containing exactly 4 bytes
 * @returns Unsigned 32-bit integer (0-4294967295)
 */
export function intTuple4ToUInt32(data: [number, number, number, number]): number {
  return ((data[0] & 0xFF) << 24) | ((data[1] & 0xFF) << 16) | ((data[2] & 0xFF) << 8) | (data[3] & 0xFF)
}

/**
 * Converts a single byte to a signed 8-bit integer
 * @param data Tuple containing exactly 1 byte
 * @returns Signed 8-bit integer (-128 to 127)
 */
export function intTuple1ToInt8(data: [number]): number {
  const value = data[0] & 0xFF
  return value > 127 ? value - 256 : value
}

// ============================================================================
// IDENTIFICATION-SPECIFIC PARSING FUNCTIONS
// Used primarily in identification registers
// ============================================================================

/**
 * Converts a single byte to a connected sensors bit field mapping
 * @param data Tuple containing exactly 1 byte with sensor connection flags
 * @returns Object mapping sensor names to boolean connection status
 */
export function intTuple1ToConnectedSensors(data: [number]): Record<string, boolean> {
  const sensors: Record<string, boolean> = {}
  // create a mapping for sensor numbers 1-4
  for (let i = 1; i <= 4; i++) {
    sensors[`sensor${i}`] = Boolean(data[0] & (1 << (i - 1)))
  }
  return sensors
}

/**
 * Converts a single byte to an existing channels bit field mapping
 * @param data Tuple containing exactly 1 byte with channel existence flags
 * @returns Object mapping channel names to boolean existence status
 */
export function intTuple1ToExistingChannels(data: [number]): Record<string, boolean> {
  const channels: Record<string, boolean> = {}
  // create a mapping for channel numbers 1-8
  for (let i = 1; i <= 8; i++) {
    channels[`channel${i}`] = Boolean(data[0] & (1 << (i - 1)))
  }
  return channels
}

/**
 * Converts a single byte to a product sub-ID string using the lookup table
 * @param data Tuple containing exactly 1 byte with product sub-ID value
 * @returns Product sub-ID string from the lookup table
 * @throws Error if the value is not found in the lookup table
 */
export function intTuple1ToProductSubId(data: [number]): string {
  const value = intTuple1ToUInt8(data)
  const result = productSubIdLookup[value as keyof typeof productSubIdLookup]
  if (result === undefined) {
    throw new Error(`Unknown product sub-ID value: ${value} (0x${value.toString(16).padStart(2, '0')})`)
  }
  return result
}

/**
 * Converts a single byte to a channel plan value.
 *
 * NOTE: The lookup-based approach for LoRaWAN and Mioty channel plans is currently not used
 * due to issues with the lookups. This function now only returns the numeric value.
 *
 * @param data Tuple containing exactly 1 byte with channel plan value
 * @returns Channel plan as a non-negative integer (0-255)
 *
 * Currently just passes through the value from {@link intTuple1ToUInt8}.
 */
export function intTuple1ToChannelPlan(data: [number]): number {
  const value = intTuple1ToUInt8(data)
  // If lookups are fixed, consider mapping value to LoRaWANChannelPlanLookup or MiotyChannelPlanLookup here.
  return value
}

/**
 * Converts a single byte to a measurand string using the lookup table
 * @param data Tuple containing exactly 1 byte with measurand value
 * @returns Measurand string from the lookup table
 * @throws Error if the value is not found in the lookup table
 */
export function intTuple1ToMeasurand(data: [number]): string {
  const value = intTuple1ToUInt8(data)
  const result = measurandLookup[value as keyof typeof measurandLookup]
  if (result === undefined) {
    throw new Error(`Unknown measurand value: ${value} (0x${value.toString(16).padStart(2, '0')})`)
  }
  return result
}

/**
 * Converts a single byte to a unit string using the lookup table
 * @param data Tuple containing exactly 1 byte with unit value
 * @returns Unit string from the lookup table
 * @throws Error if the value is not found in the lookup table
 */
export function intTuple1ToUnit(data: [number]): string {
  const value = intTuple1ToUInt8(data)
  const result = unitsLookup[value as keyof typeof unitsLookup]
  if (result === undefined) {
    throw new Error(`Unknown unit value: ${value} (0x${value.toString(16).padStart(2, '0')})`)
  }
  return result
}

/**
 * Converts a 2-byte tuple to an accuracy percentage value
 * @param data Tuple containing exactly 2 bytes representing accuracy in 0.001% units
 * @returns Accuracy as a percentage (0-100)
 * @example
 * // For accuracy value 500 (representing 0.5%)
 * intTuple2ToAccuracyPercent([244, 1]) // Returns 0.5
 */
export function intTuple2ToAccuracyPercent(data: [number, number]): number {
  const rawValue = intTuple2ToUInt16(data)
  // Convert from 0.001% units to percentage (divide by 1000)
  return rawValue / 1000
}

// ============================================================================
// CONFIGURATION-SPECIFIC PARSING FUNCTIONS
// Used primarily in configuration registers
// ============================================================================

/**
 * Converts a single byte to a sample channel bit field mapping
 * @param data Tuple containing exactly 1 byte with channel sampling flags
 * @returns Object mapping channel names to boolean sampling status
 */
export function intTuple1ToSampleChannels(data: [number]): Record<string, boolean> {
  const channels: Record<string, boolean> = {}
  // Bit mapping: Bit 7 = channel 8, Bit 6 = channel 7, ..., Bit 0 = channel 1
  for (let i = 1; i <= 8; i++) {
    channels[`channel${i}`] = Boolean(data[0] & (1 << (i - 1)))
  }
  return channels
}

/**
 * Converts a single byte to a protocol data type enum
 * @param data Tuple containing exactly 1 byte with protocol data type value
 * @returns Protocol data type string
 */
export function intTuple1ToProtocolDataType(data: [number]): string {
  const value = intTuple1ToUInt8(data)
  return protocolDataTypeLookup[value as keyof typeof protocolDataTypeLookup] || `Unknown type: ${value}`
}

/**
 * Converts a single byte to a process alarm enabled bit field mapping
 * @param data Tuple containing exactly 1 byte with alarm enable flags
 * @returns Object mapping alarm types to boolean enabled status
 */
export function intTuple1ToProcessAlarmEnabled(data: [number]): Record<string, boolean> {
  const value = data[0] & 0xFF
  return {
    lowThreshold: Boolean(value & 0x80), // Bit 7
    highThreshold: Boolean(value & 0x40), // Bit 6
    fallingSlope: Boolean(value & 0x20), // Bit 5
    risingSlope: Boolean(value & 0x10), // Bit 4
    lowThresholdWithDelay: Boolean(value & 0x08), // Bit 3
    highThresholdWithDelay: Boolean(value & 0x04), // Bit 2
    // Bit 1 and 0 are RFU (Reserved for Future Use)
  }
}

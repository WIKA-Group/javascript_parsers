import type { Range } from './types'
import nstr from 'nstr'
import * as v from 'valibot'

export const DEFAULT_ROUNDING_DECIMALS = 4

/**
 * Returns the number of decimals to use for rounding, with robust handling for edge cases.
 *
 * @param roundingDecimals The requested number of decimals (may be undefined, NaN, Infinity, etc.)
 * @param currentDecimals The fallback number of decimals if roundingDecimals is not valid
 * @returns The number of decimals to use for rounding
 *
 * - If roundingDecimals is undefined, NaN, or -Infinity, returns fallback (currentDecimals or DEFAULT_ROUNDING_DECIMALS)
 * - If roundingDecimals is Infinity, returns Infinity
 * - If Math.floor(roundingDecimals) >= 0, returns Math.floor(roundingDecimals)
 * - Otherwise, returns fallback
 */
export function getRoundingDecimals(roundingDecimals: number | undefined, currentDecimals?: number | undefined): number {
  const fallbackDecimals = currentDecimals ?? DEFAULT_ROUNDING_DECIMALS

  if (roundingDecimals === undefined || Number.isNaN(roundingDecimals) || roundingDecimals === -Infinity) {
    return fallbackDecimals
  }
  if (roundingDecimals === Infinity) {
    return Infinity
  }
  return Math.floor(roundingDecimals) >= 0 ? Math.floor(roundingDecimals) : fallbackDecimals
}

/**
 * Converts an array of numbers to an array of bytes.
 * Each number in the input array is converted to its byte representation
 * and then all bytes are flattened into a single array.
 *
 * @param numbers Array of objects containing value and byte length
 * @param numbers.value The numeric value to convert
 * @param numbers.bytes The number of bytes to represent the value
 * @returns The flattened byte array
 * @example
 * numbersToIntArray([{value: 0x1234, bytes: 2}, {value: 0x5678, bytes: 2}])
 * // Returns: [0x12, 0x34, 0x56, 0x78]
 */
export function numbersToIntArray(numbers: {
  value: number
  bytes: number
}[]): number[] {
  return numbers.map(({ value, bytes }) => numberToIntArray(value, bytes)).flat()
}

/**
 * Converts a single number to an array of bytes in big-endian format.
 * The function converts the number to a hexadecimal string, pads it to the required
 * byte length, and then converts each pair of hex digits to a byte value.
 *
 * Note: This function does not validate input types or handle negative numbers.
 * Ensure you pass valid unsigned integers for predictable results.
 *
 * @param value The number to convert (should be a valid unsigned integer)
 * @param byteLength The number of bytes to represent the value
 * @returns Array of bytes representing the number in big-endian format
 * @example
 * numberToIntArray(0x1234, 2) // Returns: [0x12, 0x34]
 * numberToIntArray(2, 2) // Returns: [0x00, 0x02]
 * numberToIntArray(0x12345678, 4) // Returns: [0x12, 0x34, 0x56, 0x78]
 */
export function numberToIntArray(value: number, byteLength: number): number[] {
  // Convert number to hex string and pad with zeros to match byte length
  const hexString = value.toString(16).padStart(byteLength * 2, '0')
  const arr: number[] = Array.from({ length: byteLength })

  // Parse each pair of hex digits into a byte value
  let hexIndex = 0
  let byteIndex = 0
  while (hexIndex < hexString.length) {
    arr[byteIndex] = Number.parseInt(hexString.slice(hexIndex, hexIndex + 2), 16)
    hexIndex += 2
    byteIndex++
  }
  return arr
}

/**
 * Converts a hexadecimal string to an array of integer bytes.
 * The function handles various hex string formats including prefixes and spaces.
 * Returns null if the input string contains invalid hexadecimal characters.
 *
 * @param hexString The hexadecimal string to convert (supports '0x' prefix and spaces)
 * @returns Array of integer bytes or null if invalid hex string
 * @example
 * hexStringToIntArray('1234') // Returns: [0x12, 0x34]
 * hexStringToIntArray('0x1234') // Returns: [0x12, 0x34]
 * hexStringToIntArray('12 34') // Returns: [0x12, 0x34]
 * hexStringToIntArray('xyz') // Returns: null (invalid hex)
 */
export function hexStringToIntArray(hexString: string): number[] | null {
  // Remove spaces and optional '0x' prefix
  let adjustedString = hexString.replaceAll(' ', '')
  adjustedString = adjustedString.startsWith('0x') ? adjustedString.slice(2) : adjustedString

  // Validate that the string contains only valid hexadecimal characters
  const schema = v.pipe(v.string(), v.hexadecimal())
  const result = v.safeParse(schema, adjustedString)
  if (!result.success) {
    return null
  }

  const intArray: number[] = []

  // Convert each pair of hex characters to a byte value
  for (let i = 0; i < result.output.length; i += 2) {
    const byte = Number.parseInt(result.output.slice(i, i + 2), 16)
    intArray.push(byte)
  }

  return intArray
}

/**
 * Converts a percentage value to a real value within a specified range.
 * The function performs linear interpolation between the minimum and maximum values
 * based on the given percentage.
 *
 * @param percentage The percentage value (must be between 0 and 100)
 * @param range Object containing min and max values for the target range
 * @param range.start The minimum value of the range
 * @param range.end The maximum value of the range
 * @returns The calculated value within the specified range
 * @throws {RangeError} When range.start is not less than range.end
 * @example
 * percentageToValue(50, {min: 0, max: 100}) // Returns: 50
 * percentageToValue(25, {min: -10, max: 10}) // Returns: -5
 * percentageToValue(0, {min: 5, max: 15}) // Returns: 5
 * percentageToValue(100, {min: 5, max: 15}) // Returns: 15
 */
export function percentageToValue(percentage: number, range: Range): number {
  if (range.start >= range.end) {
    throw new RangeError('Range start must be less than range end')
  }
  // Linear interpolation: min + (max - min) * (percentage / 100)
  return (range.end - range.start) * (percentage / 100) + range.start
}

/**
 * Converts a TULIP scale value to a real value within a specified range.
 * TULIP scale uses values from 2500 to 12500, where:
 * - 2500 represents 0% (minimum value)
 * - 7500 represents 50% (middle value)
 * - 12500 represents 100% (maximum value)
 *
 * The function first converts the TULIP value to a percentage, then maps
 * that percentage to the specified range using linear interpolation.
 *
 * @param tulipValue The TULIP scale value (must be between 2500 and 12500)
 * @param range Object containing min and max values for the target range
 * @param range.start The minimum value of the range
 * @param range.end The maximum value of the range
 * @returns The calculated value within the specified range
 * Uses {@link percentageToValue} internally, which may throw errors itself.
 * @example
 * TULIPValueToValue(2500, {min: 0, max: 100}) // Returns: 0 (0%)
 * TULIPValueToValue(7500, {min: 0, max: 100}) // Returns: 50 (50%)
 * TULIPValueToValue(12500, {min: 0, max: 100}) // Returns: 100 (100%)
 * TULIPValueToValue(5000, {min: -10, max: 10}) // Returns: -5 (25%)
 */
export function TULIPValueToValue(tulipValue: number, range: Range): number {
  // Convert TULIP scale value (2500 - 12500) to percentage (0 - 100)
  const percentage = (((tulipValue - 2500) * (100 - 0)) / 10_000) + 0

  // Use the existing percentageToValue function to map to the target range
  return percentageToValue(percentage, range)
}

/**
 * Converts a slope scale value to a real value within a specified range.
 *
 * The slope scale uses values from 0 to 10_000 (inclusive). This maps linearly
 * to a percentage between 0 and 100 by dividing the slope value by 100, and
 * then uses {@link percentageToValue} to map that percentage into the provided
 * range using linear interpolation.
 *
 * @param slopeValue The slope scale value (must be between 0 and 10_000 inclusive)
 * @param range Object containing min and max values for the target range
 * @param range.start The minimum value of the range
 * @param range.end The maximum value of the range
 * @returns The calculated value within the specified range
 * @throws {RangeError} When slopeValue is not between 0 and 10_000
 * Uses {@link percentageToValue} internally, which may throw errors for invalid ranges or percentages.
 * @example
 * slopeValueToValue(0, {min: 0, max: 100}) // Returns: 0 (0%)
 * slopeValueToValue(5000, {min: 0, max: 100}) // Returns: 50 (50%)
 * slopeValueToValue(10000, {min: 0, max: 100}) // Returns: 100 (100%)
 * slopeValueToValue(2500, {min: -10, max: 10}) // Returns: 5 (25% of span -> 20)
 */
export function slopeValueToValue(slopeValue: number, range: Range): number {
  // slope value must be between 0 and 10_000 (inclusive)
  if (slopeValue < 0 || slopeValue > 10_000) {
    throw new RangeError(`Slope value must be between 0 and 10_000, is ${slopeValue}`)
  }

  // convert the value to 0 - 100%
  const percentage = slopeValue / 100

  // here we should only take the jump of the value according to the SPAN of the range
  // TODO: currently here we give TULIPScale / minute
  // ! this is not the same
  // correct calculation below
  // return (percentage / 100) * (range.end - range.start)
  // * will shift the values of by the range.min down
  // all tests will have to be adjusted

  return percentageToValue(percentage, range)
}

/**
 * Converts a number to a hexadecimal string.
 * @param num The number to convert.
 * @returns The hexadecimal representation of the number.
 */
export function numberToHexString(num: number): string {
  const hex = num.toString(16).padStart(2, '0')
  return `0x${hex}`
}

/**
 * Rounds a number to a specified number of decimal places.
 *
 * This function attempts to smartly handle floating point imprecisions that can occur due to repeating values
 * (such as 0.998 actually being 0.99799999... etc.), which are not exactly representable in binary floating point.
 *
 * @param value The number to round.
 * @param decimals The number of decimal places to round to (default is 0). Negative values are treated as 0.
 * Values above 100 are clamped to 100.
 * @returns The rounded number.
 * @example
 * roundValue(3.14159, 2) // Returns: 3.14
 * roundValue(123.456, 0) // Returns: 123
 * roundValue(1.005, 2) // Returns: 1.01
 */
export function roundValue(value: number, decimals?: number): number {
  decimals = typeof decimals === 'number' ? Math.min(Math.max(0, Math.floor(decimals)), 100) : undefined

  if (Number.isInteger(value)) {
    return value
  }

  const v = nstr(value + (5 * Number.EPSILON), { maxDecimals: decimals })

  // current bug in nstr that removed all "0" from the result.
  // but if it is rounded to 0 it removes it and returns ""
  if (v === '') {
    // TODO: remove once nstr is fixed
    return 0
  }

  return Number.parseFloat(v)
}

/**
 * Converts a 4-byte tuple to a 32-bit IEEE 754 float (big-endian).
 *
 * This is a small, dependency-free helper that converts four bytes into
 * a JavaScript Number using a DataView. It returns the raw IEEE-754
 * float value as produced by the platform.
 *
 * @param data Tuple containing exactly 4 bytes in big-endian order
 * @returns 32-bit floating point number (raw IEEE-754 value)
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
 * This wrapper applies a small post-processing step using `nstr` to
 * remove common floating-point precision artifacts (for example:
 * 0.30000000000000004 → "0.3"). The `threshold` parameter controls
 * detection sensitivity (non-negative integer). Higher values make the
 * function less eager to trim trailing digits.
 *
 * Note: `nstr` is used here centrally in `utils` so other modules do
 * not need to import it directly.
 *
 * @param data Tuple containing exactly 4 bytes in big-endian order
 * @param threshold Non-negative integer controlling artifact detection sensitivity (default: 3)
 * @returns Cleaned numeric value (parsed from `nstr` output)
 */
export function intTuple4ToFloat32WithThreshold(
  data: [number, number, number, number],
  threshold = 3,
): number {
  threshold = Math.max(0, Math.floor(threshold))
  const value = intTuple4ToFloat32(data)
  return Number.parseFloat(nstr(value, { threshold }))
}

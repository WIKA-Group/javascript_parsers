/**
 * Pushes a 32-bit unsigned integer as four bytes to an array in big-endian order.
 * @param array array to push the value to
 * @param value value
 */
export function pushUint32(array: number[], value: number): void {
  array.push((value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF)
}

/**
 * Pushes a 16-bit unsigned integer as two bytes to an array in big-endian order.
 * @param array array to push the value to
 * @param value value
 */
export function pushUint16(array: number[], value: number): void {
  array.push((value >> 8) & 0xFF, value & 0xFF)
}

/**
 * Pushes a 16-bit signed integer as two bytes to an array in big-endian order using two's complement.
 * @param array array to push the value to
 * @param value value (must be in range [-32768, 32767])
 */
export function pushSignedInt16(array: number[], value: number): void {
  // Convert to 16-bit signed integer using two's complement
  let encoded = value
  if (value < 0) {
    encoded = (1 << 16) + value // Two's complement for negative numbers
  }
  array.push((encoded >> 8) & 0xFF, encoded & 0xFF)
}

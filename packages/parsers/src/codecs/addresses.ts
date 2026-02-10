/**
 * TULIP3 Register Address Calculation Functions
 *
 * These functions calculate register addresses dynamically based on sensor and channel numbers,
 * matching the formulas used in the decoder register lookup tables.
 *
 * Based on WIKA TULIP3 Protocol Specification.
 */

// ============================================================================
// IDENTIFICATION REGISTER ADDRESSES
// ============================================================================

/**
 * Calculate identification register address for a sensor
 * @param sensorNumber Sensor number (1-4)
 * @param offset Register offset within sensor identification block
 * @returns Absolute register address
 */
export function getSensorIdAddress(sensorNumber: number, offset: number): number {
  // First register address of Sensor n = First address of Sensor 1 + (n - 1) * 460(bytes)
  return 0x03C + (sensorNumber - 1) * 460 + offset
}

/**
 * Calculate identification register address for a channel
 * @param sensorNumber Sensor number (1-4)
 * @param channelNumber Channel number (1-8)
 * @param offset Register offset within channel identification block
 * @returns Absolute register address
 */
export function getChannelIdAddress(sensorNumber: number, channelNumber: number, offset: number): number {
  // First address of Sensor 1 + (n - 1) * 400(bytes) + n * 60(bytes) + (m - 1) * 50(bytes)
  return 0x03C + (sensorNumber - 1) * 400 + sensorNumber * 60 + (channelNumber - 1) * 50 + offset
}

// ============================================================================
// CONFIGURATION REGISTER ADDRESSES
// ============================================================================

/**
 * Calculate configuration register address for a sensor
 * @param sensorNumber Sensor number (1-4)
 * @param offset Register offset within sensor configuration block
 * @returns Absolute register address
 */
export function getSensorConfigAddress(sensorNumber: number, offset: number): number {
  // First register address of Sensor n = First address of Sensor 1 + (n - 1) * 493(bytes)
  return 0x02A + (sensorNumber - 1) * 493 + offset
}

/**
 * Calculate configuration register address for a channel
 * @param sensorNumber Sensor number (1-4)
 * @param channelNumber Channel number (1-8)
 * @param offset Register offset within channel configuration block
 * @returns Absolute register address
 */
export function getChannelConfigAddress(sensorNumber: number, channelNumber: number, offset: number): number {
  // First register address of Channel m of Sensor n = First address of Sensor 1 + (n - 1) * 464 + n * 29 + (m - 1) * 58
  return 0x02A + (sensorNumber - 1) * 464 + sensorNumber * 29 + (channelNumber - 1) * 58 + offset
}

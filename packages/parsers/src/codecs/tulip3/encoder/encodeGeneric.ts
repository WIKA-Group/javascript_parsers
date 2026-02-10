import type { ForceCloseSessionInput, GetAlarmStatusInput, NewBatteryInsertedInput, RestoreDefaultConfigurationInput } from '../../../schemas/tulip3/downlink'
import type { MultipleDownlinkOutput } from '../../../types'
import type { TULIP3DeviceConfig } from '../profile'
import {
  MESSAGE_TYPE_GENERIC_COMMAND,
  MESSAGE_TYPE_GENERIC_REQUEST,
  SUB_TYPE_FORCE_CLOSE_SESSION,
  SUB_TYPE_GET_ALARM_STATUS,
  SUB_TYPE_NEW_BATTERY_INSERTED,
  SUB_TYPE_RESTORE_DEFAULT_CONFIG,
  TULIP3_FPORT,
} from './constants'

// =============================================================================

// =============================================================================
// GENERIC COMMAND ENCODERS (0x03)
// =============================================================================

/**
 * Encode force close session message (0x03 0x01).
 * Aborts current downlink process and closes the session.
 *
 * @returns 2-byte frame [messageType, subMessageType]
 */
export function encodeForceCloseSession(_input: ForceCloseSessionInput): number[] {
  return [MESSAGE_TYPE_GENERIC_COMMAND, SUB_TYPE_FORCE_CLOSE_SESSION]
}

/**
 * Encode restore default configuration message (0x03 0x02).
 * Replaces user configuration with factory default configuration.
 *
 * @returns 2-byte frame [messageType, subMessageType]
 */
export function encodeRestoreDefaultConfiguration(_input: RestoreDefaultConfigurationInput): number[] {
  return [MESSAGE_TYPE_GENERIC_COMMAND, SUB_TYPE_RESTORE_DEFAULT_CONFIG]
}

/**
 * Encode new battery inserted message (0x03 0x03).
 * Informs CM that battery has been replaced.
 *
 * @returns 2-byte frame [messageType, subMessageType]
 */
export function encodeNewBatteryInserted(_input: NewBatteryInsertedInput): number[] {
  return [MESSAGE_TYPE_GENERIC_COMMAND, SUB_TYPE_NEW_BATTERY_INSERTED]
}

// =============================================================================
// GENERIC REQUEST ENCODERS (0x04)
// =============================================================================

/**
 * Checks if targets match all available sensors and channels in the device profile.
 * Used to optimize payload by omitting target bytes when requesting all.
 *
 * @param targets - Optional targets object with sensor/channel structure
 * @param config - Device configuration to check against
 * @returns true if targets is omitted OR targets matches all available sensors/channels
 */
function isRequestingAllTargets<TConfig extends TULIP3DeviceConfig>(
  targets: GetAlarmStatusInput<TConfig>['targets'],
  config: TConfig,
): boolean {
  // If targets is undefined, user wants all
  if (!targets)
    return true

  // Get all available sensor/channel keys from config
  const availableSensors = Object.keys(config).filter(k => k.startsWith('sensor'))

  // Check if all available sensors are present in targets
  for (const sensorKey of availableSensors) {
    const sensorTargets = targets[sensorKey as keyof typeof targets]
    const sensorConfig = config[sensorKey as keyof typeof config]

    if (!sensorConfig || typeof sensorConfig !== 'object')
      continue

    // If sensor is not in targets, not requesting all
    if (!sensorTargets)
      return false

    // Get all available channels for this sensor
    const availableChannels = Object.keys(sensorConfig).filter(k => k.startsWith('channel'))

    // Check if all available channels are present and set to true
    for (const channelKey of availableChannels) {
      const channelRequested = (sensorTargets as any)[channelKey]
      if (!channelRequested)
        return false
    }
  }

  return true
}

/**
 * Encode get alarm status message (0x04 0x01).
 * Requests current alarm status of selected alarm types and optionally specific sensors/channels.
 *
 * Encoding format:
 * - Byte 0: Message type (0x04)
 * - Byte 1: Sub message type (0x01)
 * - Byte 2: Alarm requested bitfield (bits 0-3: process/CM/sensor/channel, bits 4-7: RFU)
 * - Byte 3+: Optional sensor/channel IDs (omitted if requesting all)
 *   - Each ID byte: bits 7-6 = sensor ID (0-3), bits 5-3 = channel ID (0-7), bits 2-0 = RFU
 *
 * @param input - Alarm status request input
 * @param config - Device configuration for target validation
 * @returns Byte array with alarm request bitfield and optional target IDs
 * @throws {Error} If no alarm types are requested
 */
export function encodeGetAlarmStatus<TConfig extends TULIP3DeviceConfig>(
  input: GetAlarmStatusInput<TConfig>,
  config: TConfig,
): number[] {
  // Build alarm requested bitfield (byte 2)
  let alarmBitfield = 0

  if (input.processAlarmRequested)
    alarmBitfield |= 0b0001 // Bit 0
  if (input.cmAlarmRequested)
    alarmBitfield |= 0b0010 // Bit 1
  if (input.sensorAlarmRequested)
    alarmBitfield |= 0b0100 // Bit 2
  if (input.channelAlarmRequested)
    alarmBitfield |= 0b1000 // Bit 3

  // Validate at least one alarm type is requested
  if (alarmBitfield === 0) {
    throw new Error('At least one alarm type must be requested')
  }

  const frame = [
    MESSAGE_TYPE_GENERIC_REQUEST,
    SUB_TYPE_GET_ALARM_STATUS,
    alarmBitfield,
  ]

  // Optimize: if requesting all sensors/channels, omit target bytes
  if (isRequestingAllTargets(input.targets, config)) {
    return frame
  }

  // Encode specific sensor/channel targets
  const targets = input.targets!
  const targetBytes: number[] = []

  // Iterate through sensors in order (sensor1, sensor2, etc.)
  const sensorKeys = Object.keys(targets).filter(k => k.startsWith('sensor')).sort()

  for (const sensorKey of sensorKeys) {
    const sensorTargets = targets[sensorKey as keyof typeof targets]
    if (!sensorTargets)
      continue

    // Extract sensor number (sensor1 → 0, sensor2 → 1, etc.)
    const sensorNumber = Number.parseInt(sensorKey.replace('sensor', '')) - 1

    // Iterate through channels in order (channel1, channel2, etc.)
    const channelKeys = Object.keys(sensorTargets).filter(k => k.startsWith('channel')).sort()

    for (const channelKey of channelKeys) {
      const channelRequested = (sensorTargets as any)[channelKey]
      if (!channelRequested)
        continue

      // Extract channel number (channel1 → 0, channel2 → 1, etc.)
      const channelNumber = Number.parseInt(channelKey.replace('channel', '')) - 1

      // Encode target ID byte: bits 7-6 = sensor ID, bits 5-3 = channel ID, bits 2-0 = RFU (0)
      const targetByte = ((sensorNumber & 0b11) << 6) | ((channelNumber & 0b111) << 3)
      targetBytes.push(targetByte)
    }
  }

  return [...frame, ...targetBytes]
}

// =============================================================================
// COMPLETE ENCODING FUNCTIONS WITH METADATA
// =============================================================================

/**
 * Complete encoding for force close session command with metadata validation.
 *
 * @param metadata - Encoding metadata with byteLimit
 * @param metadata.byteLimit - Maximum allowed bytes for the frame
 * @returns MultipleDownlinkOutput with single frame
 * @throws Error if frame exceeds byteLimit
 */
export function encodeForceCloseSessionComplete(metadata: { byteLimit: number }): MultipleDownlinkOutput {
  const bytes = encodeForceCloseSession({})

  if (bytes.length > metadata.byteLimit) {
    throw new Error(`Frame size ${bytes.length} exceeds limit of ${metadata.byteLimit} bytes`)
  }

  return {
    fPort: TULIP3_FPORT,
    frames: [bytes],
  }
}

/**
 * Complete encoding for restore default configuration command with metadata validation.
 *
 * @param metadata - Encoding metadata with byteLimit
 * @param metadata.byteLimit - Maximum allowed bytes for the frame
 * @returns MultipleDownlinkOutput with single frame
 * @throws Error if frame exceeds byteLimit
 */
export function encodeRestoreDefaultConfigurationComplete(metadata: { byteLimit: number }): MultipleDownlinkOutput {
  const bytes = encodeRestoreDefaultConfiguration({})

  if (bytes.length > metadata.byteLimit) {
    throw new Error(`Frame size ${bytes.length} exceeds limit of ${metadata.byteLimit} bytes`)
  }

  return {
    fPort: TULIP3_FPORT,
    frames: [bytes],
  }
}

/**
 * Complete encoding for new battery inserted command with metadata validation.
 *
 * @param metadata - Encoding metadata with byteLimit
 * @param metadata.byteLimit - Maximum allowed bytes for the frame
 * @returns MultipleDownlinkOutput with single frame
 * @throws Error if frame exceeds byteLimit
 */
export function encodeNewBatteryInsertedComplete(metadata: { byteLimit: number }): MultipleDownlinkOutput {
  const bytes = encodeNewBatteryInserted({})

  if (bytes.length > metadata.byteLimit) {
    throw new Error(`Frame size ${bytes.length} exceeds limit of ${metadata.byteLimit} bytes`)
  }

  return {
    fPort: TULIP3_FPORT,
    frames: [bytes],
  }
}

/**
 * Complete encoding for get alarm status request with metadata validation.
 *
 * @param input - Alarm status request input
 * @param config - Device configuration for target validation
 * @param metadata - Encoding metadata with byteLimit
 * @param metadata.byteLimit - Maximum allowed bytes for the frame
 * @returns MultipleDownlinkOutput with single frame
 * @throws Error if frame exceeds byteLimit or no alarm types requested
 */
export function encodeGetAlarmStatusComplete<TConfig extends TULIP3DeviceConfig>(
  input: GetAlarmStatusInput<TConfig>,
  config: TConfig,
  metadata: { byteLimit: number },
): MultipleDownlinkOutput {
  const bytes = encodeGetAlarmStatus(input, config)

  if (bytes.length > metadata.byteLimit) {
    throw new Error(`Frame size ${bytes.length} exceeds limit of ${metadata.byteLimit} bytes`)
  }

  return {
    fPort: TULIP3_FPORT,
    frames: [bytes],
  }
}

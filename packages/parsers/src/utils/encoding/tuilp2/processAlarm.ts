import type { DownlinkCommand } from './frames'
import { pushUint16 } from '../push'

const PROCESS_ALARM_COMMAND = 0x20

const RESERVED_SECOND_BYTE = 0x00

type ProcessAlarmChannelConfig = {
  /**
   * Dead band in percent of the span.
   * @example Range 4-20 -> span: 16 -> deaBand: 25% -> will have a dead band of 4
   */
  deadBand: number
  lowThreshold?: number
  highThreshold?: number
  lowThresholdWithDelay?: {
    value: number
    delay: number
  }
  highThresholdWithDelay?: {
    value: number
    delay: number
  }
  risingSlope?: number
  fallingSlope?: number
  // measureOffset?: number
  // startUpTime?: number
} | true

export interface ProcessAlarmConfig {
  [key: `channel${number}`]: ProcessAlarmChannelConfig
}

/**
 * Builds the downlink commands for process alarm configuration.
 * @param config The process alarm configuration.
 * @returns The downlink commands for process alarm configuration.
 * @note When a channel is set to "true", the channel is "enabled" but will have all alarms disabled and a deadband of 0.
 */
export function buildProcessAlarmCommands(
  config: ProcessAlarmConfig | undefined,
  _payloadLimit: number,
): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  Object.keys(config).forEach((key) => {
    const numberString = key.replace('channel', '')
    const channelIndex = Number.parseInt(numberString, 10)
    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }
    const channelConfig = config[key as keyof typeof config]!

    const channelBytes = buildProcessAlarmBytes(channelConfig, _payloadLimit)
    const bytes: number[] = [PROCESS_ALARM_COMMAND, RESERVED_SECOND_BYTE, channelIndex] // command, reserved, channel index
    bytes.push(...channelBytes)

    commands.push(bytes)
  })

  return commands
}

/**
 * This function only encodes the parameters for a single channel.
 * It does not include the configuration ID or any channel selection mask.
 */
function buildProcessAlarmBytes(
  channelConfig: ProcessAlarmChannelConfig,
  _payloadLimit: number,
): number[] {
  const bytes: number[] = []

  // if the channel is "true" we just enable the process alarm with a deadband of 0
  if (channelConfig === true) {
    bytes.push(0x00, 0x00) // deadband 0 (2 bytes)
    bytes.push(0x00) // alarm mask: all disabled
    return bytes
  }

  // deadband in 0.01% of span (2 bytes, big-endian)
  const deadBandValue = Math.round(channelConfig.deadBand * 100)
  pushUint16(bytes, deadBandValue)

  // build alarm mask byte
  // bit 7: Alarm 1 - Low threshold
  // bit 6: Alarm 2 - High threshold
  // bit 5: Alarm 3 - Falling slope
  // bit 4: Alarm 4 - Rising slope
  // bit 3: Alarm 5 - Low threshold with delay
  // bit 2: Alarm 6 - High threshold with delay
  // bit 1-0: Reserved
  let alarmMask = 0

  const alarms = channelConfig
  if (alarms) {
    if (alarms.lowThreshold !== undefined)
      alarmMask |= 0x80 // bit 7
    if (alarms.highThreshold !== undefined)
      alarmMask |= 0x40 // bit 6
    if (alarms.fallingSlope !== undefined)
      alarmMask |= 0x20 // bit 5
    if (alarms.risingSlope !== undefined)
      alarmMask |= 0x10 // bit 4
    if (alarms.lowThresholdWithDelay !== undefined)
      alarmMask |= 0x08 // bit 3
    if (alarms.highThresholdWithDelay !== undefined)
      alarmMask |= 0x04 // bit 2
  }

  bytes.push(alarmMask)

  // add threshold/slope/delay values for enabled alarms in order
  if (alarms) {
    // Alarm 1: Low threshold
    if (alarms.lowThreshold !== undefined) {
      pushUint16(bytes, alarms.lowThreshold)
    }

    // Alarm 2: High threshold
    if (alarms.highThreshold !== undefined) {
      pushUint16(bytes, alarms.highThreshold)
    }

    // Alarm 3: Falling slope
    if (alarms.fallingSlope !== undefined) {
      pushUint16(bytes, alarms.fallingSlope)
    }

    // Alarm 4: Rising slope
    if (alarms.risingSlope !== undefined) {
      pushUint16(bytes, alarms.risingSlope)
    }

    // Alarm 5: Low threshold with delay
    if (alarms.lowThresholdWithDelay !== undefined) {
      pushUint16(bytes, alarms.lowThresholdWithDelay.value)
      pushUint16(bytes, alarms.lowThresholdWithDelay.delay)
    }

    // Alarm 6: High threshold with delay
    if (alarms.highThresholdWithDelay !== undefined) {
      pushUint16(bytes, alarms.highThresholdWithDelay.value)
      pushUint16(bytes, alarms.highThresholdWithDelay.delay)
    }
  }

  return bytes
}

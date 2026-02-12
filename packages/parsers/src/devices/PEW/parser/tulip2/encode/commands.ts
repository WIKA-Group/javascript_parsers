import { pushSignedInt16, pushUint16, pushUint32 } from '../../../../../utils/encoding/push'
import { PEW_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

// ─── Simple commands ────────────────────────────────────────────────────────────

export function buildResetFactoryCommand(): DownlinkCommand {
  return [PEW_COMMANDS.RESET_FACTORY]
}

export function buildResetBatteryCommand(): DownlinkCommand {
  return [PEW_COMMANDS.RESET_BATTERY]
}

export function buildDropOnAirCommand(): DownlinkCommand {
  return [PEW_COMMANDS.DROP_ON_AIR]
}

export function buildGetMainConfigCommand(): DownlinkCommand {
  return [PEW_COMMANDS.GET_MAIN_CONFIG]
}

export function buildGetAlarmConfigCommand(channelId: 0 | 1): DownlinkCommand {
  return [channelId === 0 ? PEW_COMMANDS.GET_PRESSURE_ALARM : PEW_COMMANDS.GET_TEMPERATURE_ALARM]
}

export function buildGetPropertyCommand(channelId: 0 | 1): DownlinkCommand {
  return [channelId === 0 ? PEW_COMMANDS.GET_PRESSURE_PROPERTY : PEW_COMMANDS.GET_TEMPERATURE_PROPERTY]
}

// ─── Disable channel commands ───────────────────────────────────────────────────

export interface PEWDisableChannelConfig {
  channel0?: boolean
  channel1?: boolean
}

/**
 * Build disable channel commands for PEW.
 * PEW uses individual command bytes per channel: 0x10 for pressure, 0x11 for temperature.
 */
export function buildPEWDisableChannelCommands(config: PEWDisableChannelConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  if (config.channel0 === true) {
    commands.push([PEW_COMMANDS.DISABLE_PRESSURE])
  }

  if (config.channel1 === true) {
    commands.push([PEW_COMMANDS.DISABLE_TEMPERATURE])
  }

  return commands
}

// ─── Main configuration command ─────────────────────────────────────────────────

export interface PEWMainConfiguration {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
  isBLEEnabled?: boolean
}

const MAX_TOTAL_INTERVAL_SECONDS = 172_800

/**
 * Build set main configuration command for PEW.
 * PEW main config has 2 extra bytes vs NETRIS2:
 * - Byte 13: PEW protocol version (always 0x00)
 * - Byte 14: No data in advertising (0 = BLE includes data, 1 = BLE does not include data)
 *
 * Total: [0x02, measRate_noAlarm(4), pubFactor_noAlarm(2), measRate_alarm(4), pubFactor_alarm(2), protocolVersion(1), bleFlag(1)]
 */
export function buildPEWMainConfigCommand(config: PEWMainConfiguration | undefined, payloadLimit: number): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const noAlarmTotalInterval = config.measuringRateWhenNoAlarm * config.publicationFactorWhenNoAlarm
  const alarmTotalInterval = config.measuringRateWhenAlarm * config.publicationFactorWhenAlarm

  if (noAlarmTotalInterval > MAX_TOTAL_INTERVAL_SECONDS) {
    throw new Error('The product of measuringRateWhenNoAlarm and publicationFactorWhenNoAlarm must not exceed 172_800 seconds (48 hours).')
  }

  if (alarmTotalInterval > MAX_TOTAL_INTERVAL_SECONDS) {
    throw new Error('The product of measuringRateWhenAlarm and publicationFactorWhenAlarm must not exceed 172_800 seconds (48 hours).')
  }

  const bytes: number[] = [PEW_COMMANDS.SET_MAIN_CONFIG]

  pushUint32(bytes, config.measuringRateWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint32(bytes, config.measuringRateWhenAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)

  // PEW protocol version = 0x00
  bytes.push(0x00)

  // No data in advertising: 0 = BLE includes measurement data, 1 = BLE does not
  // isBLEEnabled: true -> data in advertising -> byte = 0
  // isBLEEnabled: false -> no data in advertising -> byte = 1
  const bleAdvertisingFlag = config.isBLEEnabled === false ? 1 : 0
  bytes.push(bleAdvertisingFlag)

  if (bytes.length > payloadLimit) {
    throw new Error(`Main configuration command exceeds byte limit of ${payloadLimit} bytes.`)
  }

  return [bytes]
}

// ─── Process alarm commands ─────────────────────────────────────────────────────

type PEWProcessAlarmChannelConfig = {
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
} | true

export interface PEWProcessAlarmConfig {
  channel0?: PEWProcessAlarmChannelConfig
  channel1?: PEWProcessAlarmChannelConfig
}

/**
 * Build set process alarm commands for PEW.
 * PEW uses per-channel command IDs: 0x20 for pressure, 0x21 for temperature.
 * Format: [cmdByte, deadBand(2), alarmMask, ...alarm values]
 * No reserved byte or channel index like NETRIS2.
 */
export function buildPEWProcessAlarmCommands(config: PEWProcessAlarmConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  if (config.channel0 !== undefined) {
    const bytes = buildPEWProcessAlarmBytes(PEW_COMMANDS.SET_PRESSURE_ALARM, config.channel0)
    commands.push(bytes)
  }

  if (config.channel1 !== undefined) {
    const bytes = buildPEWProcessAlarmBytes(PEW_COMMANDS.SET_TEMPERATURE_ALARM, config.channel1)
    commands.push(bytes)
  }

  return commands
}

function buildPEWProcessAlarmBytes(commandByte: number, channelConfig: PEWProcessAlarmChannelConfig): number[] {
  const bytes: number[] = [commandByte]

  if (channelConfig === true) {
    bytes.push(0x00, 0x00) // deadband 0 (2 bytes)
    bytes.push(0x00) // alarm mask: all disabled
    return bytes
  }

  pushUint16(bytes, channelConfig.deadBand)

  let alarmMask = 0

  if (channelConfig.lowThreshold !== undefined)
    alarmMask |= 0x80
  if (channelConfig.highThreshold !== undefined)
    alarmMask |= 0x40
  if (channelConfig.fallingSlope !== undefined)
    alarmMask |= 0x20
  if (channelConfig.risingSlope !== undefined)
    alarmMask |= 0x10
  if (channelConfig.lowThresholdWithDelay !== undefined)
    alarmMask |= 0x08
  if (channelConfig.highThresholdWithDelay !== undefined)
    alarmMask |= 0x04

  bytes.push(alarmMask)

  if (channelConfig.lowThreshold !== undefined)
    pushUint16(bytes, channelConfig.lowThreshold)
  if (channelConfig.highThreshold !== undefined)
    pushUint16(bytes, channelConfig.highThreshold)
  if (channelConfig.fallingSlope !== undefined)
    pushUint16(bytes, channelConfig.fallingSlope)
  if (channelConfig.risingSlope !== undefined)
    pushUint16(bytes, channelConfig.risingSlope)
  if (channelConfig.lowThresholdWithDelay !== undefined) {
    pushUint16(bytes, channelConfig.lowThresholdWithDelay.value)
    pushUint16(bytes, channelConfig.lowThresholdWithDelay.delay)
  }
  if (channelConfig.highThresholdWithDelay !== undefined) {
    pushUint16(bytes, channelConfig.highThresholdWithDelay.value)
    pushUint16(bytes, channelConfig.highThresholdWithDelay.delay)
  }

  return bytes
}

// ─── Measure offset commands ────────────────────────────────────────────────────

export interface PEWMeasureOffsetConfig {
  channel0?: { offset: number }
  channel1?: { offset: number }
}

/**
 * Build set channel property (offset) commands for PEW.
 * PEW uses per-channel command IDs: 0x30 for pressure, 0x31 for temperature.
 * Format: [cmdByte, offset(signed int16)]
 */
export function buildPEWMeasureOffsetCommands(config: PEWMeasureOffsetConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  if (config.channel0?.offset !== undefined) {
    const bytes: number[] = [PEW_COMMANDS.SET_PRESSURE_PROPERTY]
    pushSignedInt16(bytes, config.channel0.offset)
    commands.push(bytes)
  }

  if (config.channel1?.offset !== undefined) {
    const bytes: number[] = [PEW_COMMANDS.SET_TEMPERATURE_PROPERTY]
    pushSignedInt16(bytes, config.channel1.offset)
    commands.push(bytes)
  }

  return commands
}

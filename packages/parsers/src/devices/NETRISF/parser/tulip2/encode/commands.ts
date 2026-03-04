import { pushSignedInt16, pushUint16, pushUint32 } from '../../../../../utils/encoding/push'
import { NETRISF_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

// ─── Simple commands ─────────────────────────────────────────────────────────

export function buildResetFactoryCommand(): DownlinkCommand {
  return [NETRISF_COMMANDS.RESET_FACTORY]
}

export function buildResetBatteryCommand(): DownlinkCommand {
  return [NETRISF_COMMANDS.RESET_BATTERY]
}

export function buildGetMainConfigCommand(): DownlinkCommand {
  return [NETRISF_COMMANDS.GET_MAIN_CONFIG]
}

export function buildGetAlarmConfigCommand(channelId: 0 | 1): DownlinkCommand {
  return [channelId === 0 ? NETRISF_COMMANDS.GET_STRAIN_ALARM : NETRISF_COMMANDS.GET_TEMPERATURE_ALARM]
}

export function buildGetPropertyCommand(channelId: 0 | 1): DownlinkCommand {
  return [channelId === 0 ? NETRISF_COMMANDS.GET_STRAIN_PROPERTY : NETRISF_COMMANDS.GET_TEMPERATURE_PROPERTY]
}

// ─── Main configuration command ──────────────────────────────────────────────

export interface NetrisFMainConfiguration {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
  isBLEEnabled?: boolean
}

const MAX_MEASURING_RATE_SECONDS = 604_800

/**
 * Build set main configuration command for NETRISF.
 * Format: [0x02, measRate_noAlarm(4), pubFactor_noAlarm(2), measRate_alarm(4), pubFactor_alarm(2), reserved(1), bleFlag(1)]
 *
 * - bleFlag = 0: BLE advertising frame includes measurement data
 * - bleFlag = 1: BLE advertising frame does not include measurement data
 */
export function buildNetrisFMainConfigCommand(config: NetrisFMainConfiguration | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  if (config.measuringRateWhenNoAlarm < 1 || config.measuringRateWhenNoAlarm > MAX_MEASURING_RATE_SECONDS) {
    throw new Error(`measuringRateWhenNoAlarm must be between 1 and ${MAX_MEASURING_RATE_SECONDS} seconds.`)
  }

  if (config.measuringRateWhenAlarm < 1 || config.measuringRateWhenAlarm > MAX_MEASURING_RATE_SECONDS) {
    throw new Error(`measuringRateWhenAlarm must be between 1 and ${MAX_MEASURING_RATE_SECONDS} seconds.`)
  }

  const bytes: number[] = [NETRISF_COMMANDS.SET_MAIN_CONFIG]

  pushUint32(bytes, config.measuringRateWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint32(bytes, config.measuringRateWhenAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)

  // Reserved byte, always 0x00
  bytes.push(0x00)

  // BLE advertising: isBLEEnabled=false → byte=1 (no data in advertising frame)
  const bleAdvertisingFlag = config.isBLEEnabled === false ? 1 : 0
  bytes.push(bleAdvertisingFlag)

  return [bytes]
}

// ─── Process alarm commands ───────────────────────────────────────────────────

type NetrisFProcessAlarmChannelConfig = {
  deadBand: number
  lowThreshold?: number
  highThreshold?: number
  lowThresholdWithDelay?: { value: number, delay: number }
  highThresholdWithDelay?: { value: number, delay: number }
  risingSlope?: number
  fallingSlope?: number
} | true

export interface NetrisFProcessAlarmConfig {
  channel0?: NetrisFProcessAlarmChannelConfig
  channel1?: NetrisFProcessAlarmChannelConfig
}

/**
 * Build set process alarm commands for NETRISF.
 * NETRISF uses per-channel command IDs: 0x20 for strain, 0x21 for temperature.
 */
export function buildNetrisFProcessAlarmCommands(config: NetrisFProcessAlarmConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  if (config.channel0 !== undefined) {
    commands.push(buildNetrisFProcessAlarmBytes(NETRISF_COMMANDS.SET_STRAIN_ALARM, config.channel0))
  }

  if (config.channel1 !== undefined) {
    commands.push(buildNetrisFProcessAlarmBytes(NETRISF_COMMANDS.SET_TEMPERATURE_ALARM, config.channel1))
  }

  return commands
}

function buildNetrisFProcessAlarmBytes(commandByte: number, channelConfig: NetrisFProcessAlarmChannelConfig): number[] {
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

// ─── Measure offset (channel properties) commands ────────────────────────────

export interface NetrisFMeasureOffsetConfig {
  channel0?: { offset: number }
  channel1?: { offset: number }
}

/**
 * Build set channel property (offset) commands for NETRISF.
 * NETRISF uses per-channel command IDs: 0x30 for strain, 0x31 for temperature.
 * Format: [cmdByte, offset(signed int16)]
 */
export function buildNetrisFMeasureOffsetCommands(config: NetrisFMeasureOffsetConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  if (config.channel0?.offset !== undefined) {
    const bytes: number[] = [NETRISF_COMMANDS.SET_STRAIN_PROPERTY]
    pushSignedInt16(bytes, config.channel0.offset)
    commands.push(bytes)
  }

  if (config.channel1?.offset !== undefined) {
    const bytes: number[] = [NETRISF_COMMANDS.SET_TEMPERATURE_PROPERTY]
    pushSignedInt16(bytes, config.channel1.offset)
    commands.push(bytes)
  }

  return commands
}

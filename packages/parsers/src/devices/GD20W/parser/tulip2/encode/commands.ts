import { pushUint16, pushUint32 } from '../../../../../utils/encoding/push'
import { GD20W_COMMANDS, GD20W_GENERAL_DEVICE_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

export function buildResetFactoryCommand(): DownlinkCommand {
  return [GD20W_COMMANDS.RESET_FACTORY]
}

export function buildResetBatteryCommand(): DownlinkCommand {
  return [
    GD20W_COMMANDS.GENERAL_DEVICE_COMMAND,
    GD20W_GENERAL_DEVICE_COMMANDS.RESET_BATTERY_INDICATOR,
  ]
}

export function buildGetMainConfigCommand(): DownlinkCommand {
  return [GD20W_COMMANDS.GET_MAIN_CONFIG]
}

export function buildGetProcessAlarmConfigCommand(channelId: number): DownlinkCommand {
  return [GD20W_COMMANDS.GET_PROCESS_ALARM, channelId]
}

export interface GD20WMainConfiguration {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
}

const MAX_MEASURING_RATE_SECONDS = 604_800

export function buildGD20WMainConfigCommand(config: GD20WMainConfiguration | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  if (config.measuringRateWhenNoAlarm < 60 || config.measuringRateWhenNoAlarm > MAX_MEASURING_RATE_SECONDS) {
    throw new Error(`measuringRateWhenNoAlarm must be between 60 and ${MAX_MEASURING_RATE_SECONDS} seconds.`)
  }

  if (config.measuringRateWhenAlarm < 60 || config.measuringRateWhenAlarm > MAX_MEASURING_RATE_SECONDS) {
    throw new Error(`measuringRateWhenAlarm must be between 60 and ${MAX_MEASURING_RATE_SECONDS} seconds.`)
  }

  const bytes: number[] = [GD20W_COMMANDS.SET_MAIN_CONFIG]

  pushUint32(bytes, config.measuringRateWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint32(bytes, config.measuringRateWhenAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)

  // Reserved byte per GD20W spec.
  bytes.push(0x00)

  return [bytes]
}

export interface GD20WDisableChannelConfig {
  [key: `channel${number}`]: boolean
}

export function buildGD20WDisableChannelCommands(config: GD20WDisableChannelConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const disabledChannelIds = Object.keys(config)
    .filter(key => config[key as keyof GD20WDisableChannelConfig] === true)
    .map((key) => {
      const channelId = Number.parseInt(key.replace('channel', ''), 10)
      if (Number.isNaN(channelId) || channelId < 0 || channelId > 5) {
        throw new Error(`Invalid channel number ${channelId} in disable channel configuration. Must be between 0 and 5.`)
      }
      return channelId
    })

  if (disabledChannelIds.length === 0) {
    return []
  }

  const bytes: number[] = [GD20W_COMMANDS.ENABLE_DISABLE_CHANNEL, disabledChannelIds.length]
  for (const channelId of disabledChannelIds) {
    bytes.push(channelId)
    bytes.push(0x00) // 0x00 means disable for GD20W.
  }

  return [bytes]
}

type GD20WProcessAlarmChannelConfig = {
  deadBand: number
  lowThreshold?: number
  highThreshold?: number
  lowThresholdWithDelay?: { value: number, delay: number }
  highThresholdWithDelay?: { value: number, delay: number }
  risingSlope?: number
  fallingSlope?: number
} | true

export interface GD20WProcessAlarmConfig {
  [key: `channel${number}`]: GD20WProcessAlarmChannelConfig
}

export function buildGD20WProcessAlarmCommands(config: GD20WProcessAlarmConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  Object.keys(config).forEach((key) => {
    const channelId = Number.parseInt(key.replace('channel', ''), 10)
    if (Number.isNaN(channelId) || channelId < 0 || channelId > 5) {
      throw new Error(`Invalid channel number ${channelId} in process alarm configuration. Must be between 0 and 5.`)
    }

    const channelConfig = config[key as keyof GD20WProcessAlarmConfig]!
    const bytes: number[] = [GD20W_COMMANDS.SET_PROCESS_ALARM, channelId]

    if (channelConfig === true) {
      bytes.push(0x00, 0x00, 0x00)
      commands.push(bytes)
      return
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

    commands.push(bytes)
  })

  return commands
}

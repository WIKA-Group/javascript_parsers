import type {
  SharedDisableChannelConfig,
  SharedMeasureOffsetConfig,
  SharedProcessAlarmConfig,
} from '../../formatters'
import { pushSignedInt16, pushUint16, pushUint32 } from '../../utils/encoding/push'

export interface Netris3CommandBytes {
  resetFactory: number
  setMainConfig: number
  disableChannel: number
  setProcessAlarm: number
  setChannelProperty: number
}

const MAX_TOTAL_INTERVAL_SECONDS = 172_800

export function buildNetris3ResetFactoryCommand(commandBytes: Netris3CommandBytes): number[] {
  return [commandBytes.resetFactory]
}

export function buildNetris3MainConfigCommand(
  commandBytes: Netris3CommandBytes,
  config: {
    measuringRateWhenNoAlarm: number
    publicationFactorWhenNoAlarm: number
    measuringRateWhenAlarm: number
    publicationFactorWhenAlarm: number
  } | undefined,
  payloadLimit: number,
): number[][] {
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

  const bytes: number[] = [commandBytes.setMainConfig]
  pushUint32(bytes, config.measuringRateWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint32(bytes, config.measuringRateWhenAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)
  bytes.push(0x00)

  if (bytes.length > payloadLimit) {
    throw new Error(`Main configuration command exceeds byte limit of ${payloadLimit} bytes.`)
  }

  return [bytes]
}

export function buildNetris3DisableChannelCommands(
  commandBytes: Netris3CommandBytes,
  config: SharedDisableChannelConfig | undefined,
): number[][] {
  if (!config) {
    return []
  }

  const commands: number[][] = []

  Object.keys(config).forEach((key) => {
    const channelIndex = Number.parseInt(key.replace('channel', ''), 10)
    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }
    if (config[key as keyof SharedDisableChannelConfig] === true) {
      commands.push([commandBytes.disableChannel, 0x00, channelIndex])
    }
  })

  return commands
}

export function buildNetris3ProcessAlarmCommands(
  commandBytes: Netris3CommandBytes,
  config: SharedProcessAlarmConfig | undefined,
): number[][] {
  if (!config) {
    return []
  }

  const commands: number[][] = []

  Object.keys(config).forEach((key) => {
    const channelIndex = Number.parseInt(key.replace('channel', ''), 10)
    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }

    const channelConfig = config[key as keyof SharedProcessAlarmConfig]!
    const bytes = [commandBytes.setProcessAlarm, 0x00, channelIndex, ...buildNetris3ProcessAlarmBytes(channelConfig)]
    commands.push(bytes)
  })

  return commands
}

function buildNetris3ProcessAlarmBytes(channelConfig: SharedProcessAlarmConfig[`channel${number}`]): number[] {
  const bytes: number[] = []

  if (channelConfig === true) {
    bytes.push(0x00, 0x00)
    bytes.push(0x00)
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

export function buildNetris3MeasureOffsetCommands(
  commandBytes: Netris3CommandBytes,
  config: SharedMeasureOffsetConfig | undefined,
): number[][] {
  if (!config) {
    return []
  }

  const commands: number[][] = []

  Object.keys(config).forEach((key) => {
    const channelIndex = Number.parseInt(key.replace('channel', ''), 10)
    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }

    const channelConfig = config[key as keyof SharedMeasureOffsetConfig]
    if (!channelConfig) {
      return
    }

    const bytes: number[] = [commandBytes.setChannelProperty, 0x00, channelIndex]
    pushSignedInt16(bytes, channelConfig.offset)
    commands.push(bytes)
  })

  return commands
}

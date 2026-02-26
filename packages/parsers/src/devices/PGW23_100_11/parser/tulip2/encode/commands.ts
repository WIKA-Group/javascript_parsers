import type {
  SharedDisableChannelConfig,
  SharedProcessAlarmConfig,
} from '../../../../../formatters'
import { pushUint16 } from '../../../../../utils/encoding/push'
import { PGW_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

export function buildResetFactoryCommand(): DownlinkCommand {
  return [PGW_COMMANDS.RESET_FACTORY]
}

export function buildResetBatteryCommand(): DownlinkCommand {
  return [PGW_COMMANDS.RESET_BATTERY]
}

export function buildPGWMainConfigCommand(config: {
  measuringRate: number
  publicationFactorWhenNoAlarm: number
  publicationFactorWhenAlarm: number
} | undefined, payloadLimit: number): DownlinkCommand[] {
  if (!config) {
    return []
  }

  if (config.measuringRate % 10 !== 0) {
    throw new Error('Main configuration measuringRate must be a multiple of 10 seconds.')
  }

  const measuringRate = config.measuringRate / 10

  if (measuringRate < 1 || measuringRate > 65535) {
    throw new Error('Main configuration measuringRate must be between 10 and 655350 seconds.')
  }

  const bytes: number[] = [PGW_COMMANDS.SET_MAIN_CONFIG]
  pushUint16(bytes, measuringRate)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)

  if (bytes.length > payloadLimit) {
    throw new Error(`Main configuration command exceeds byte limit of ${payloadLimit} bytes.`)
  }

  return [bytes]
}

export function buildPGWDisableChannelCommands(config: SharedDisableChannelConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  const commands: DownlinkCommand[] = []

  if (config.channel0 === true) {
    commands.push([PGW_COMMANDS.DISABLE_PRESSURE])
  }

  if (config.channel1 === true) {
    commands.push([PGW_COMMANDS.DISABLE_TEMPERATURE])
  }

  return commands
}

export function buildPGWProcessAlarmCommands(config: SharedProcessAlarmConfig | undefined): DownlinkCommand[] {
  if (!config) {
    return []
  }

  if (config.channel1 !== undefined) {
    throw new Error('PGW TULIP2 does not support device temperature process-alarm configuration commands.')
  }

  if (config.channel0 === undefined) {
    return []
  }

  return [buildPGWProcessAlarmBytes(config.channel0)]
}

function buildPGWProcessAlarmBytes(channelConfig: true | SharedProcessAlarmConfig['channel0']): number[] {
  const bytes: number[] = [PGW_COMMANDS.SET_PRESSURE_ALARM]

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

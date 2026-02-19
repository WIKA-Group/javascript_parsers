import type {
  SharedDisableChannelConfig,
  SharedMeasureOffsetConfig,
  SharedProcessAlarmConfig,
} from '../../../../../formatters'
import {
  buildNetris3DisableChannelCommands,
  buildNetris3MainConfigCommand,
  buildNetris3MeasureOffsetCommands,
  buildNetris3ProcessAlarmCommands,
  buildNetris3ResetFactoryCommand,
} from '../../../../../encoding/tulip2/netris3'
import { FLRU_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

const NETRIS3_COMMANDS = {
  resetFactory: FLRU_COMMANDS.RESET_FACTORY,
  setMainConfig: FLRU_COMMANDS.SET_MAIN_CONFIG,
  disableChannel: FLRU_COMMANDS.DISABLE_CHANNEL,
  setProcessAlarm: FLRU_COMMANDS.SET_PROCESS_ALARM,
  setChannelProperty: FLRU_COMMANDS.SET_CHANNEL_PROPERTY,
} as const

export function buildResetFactoryCommand(): DownlinkCommand {
  return buildNetris3ResetFactoryCommand(NETRIS3_COMMANDS)
}

export function buildFLRUMainConfigCommand(config: {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
} | undefined, payloadLimit: number): DownlinkCommand[] {
  return buildNetris3MainConfigCommand(NETRIS3_COMMANDS, config, payloadLimit)
}

export function buildFLRUDisableChannelCommands(config: SharedDisableChannelConfig | undefined): DownlinkCommand[] {
  return buildNetris3DisableChannelCommands(NETRIS3_COMMANDS, config)
}

export function buildFLRUProcessAlarmCommands(config: SharedProcessAlarmConfig | undefined): DownlinkCommand[] {
  return buildNetris3ProcessAlarmCommands(NETRIS3_COMMANDS, config)
}

export function buildFLRUMeasureOffsetCommands(config: SharedMeasureOffsetConfig | undefined): DownlinkCommand[] {
  return buildNetris3MeasureOffsetCommands(NETRIS3_COMMANDS, config)
}

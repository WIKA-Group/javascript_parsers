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
import { TRU_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

const NETRIS3_COMMANDS = {
  resetFactory: TRU_COMMANDS.RESET_FACTORY,
  setMainConfig: TRU_COMMANDS.SET_MAIN_CONFIG,
  disableChannel: TRU_COMMANDS.DISABLE_CHANNEL,
  setProcessAlarm: TRU_COMMANDS.SET_PROCESS_ALARM,
  setChannelProperty: TRU_COMMANDS.SET_CHANNEL_PROPERTY,
} as const

export function buildResetFactoryCommand(): DownlinkCommand {
  return buildNetris3ResetFactoryCommand(NETRIS3_COMMANDS)
}

export function buildTRUMainConfigCommand(config: {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
} | undefined, payloadLimit: number): DownlinkCommand[] {
  return buildNetris3MainConfigCommand(NETRIS3_COMMANDS, config, payloadLimit)
}

export function buildTRUDisableChannelCommands(config: SharedDisableChannelConfig | undefined): DownlinkCommand[] {
  return buildNetris3DisableChannelCommands(NETRIS3_COMMANDS, config)
}

export function buildTRUProcessAlarmCommands(config: SharedProcessAlarmConfig | undefined): DownlinkCommand[] {
  return buildNetris3ProcessAlarmCommands(NETRIS3_COMMANDS, config)
}

export function buildTRUMeasureOffsetCommands(config: SharedMeasureOffsetConfig | undefined): DownlinkCommand[] {
  return buildNetris3MeasureOffsetCommands(NETRIS3_COMMANDS, config)
}

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
import { PGU_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

const NETRIS3_COMMANDS = {
  resetFactory: PGU_COMMANDS.RESET_FACTORY,
  setMainConfig: PGU_COMMANDS.SET_MAIN_CONFIG,
  disableChannel: PGU_COMMANDS.DISABLE_CHANNEL,
  setProcessAlarm: PGU_COMMANDS.SET_PROCESS_ALARM,
  setChannelProperty: PGU_COMMANDS.SET_CHANNEL_PROPERTY,
} as const

export function buildResetFactoryCommand(): DownlinkCommand {
  return buildNetris3ResetFactoryCommand(NETRIS3_COMMANDS)
}

export function buildPGUMainConfigCommand(config: {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
} | undefined, payloadLimit: number): DownlinkCommand[] {
  return buildNetris3MainConfigCommand(NETRIS3_COMMANDS, config, payloadLimit)
}

export function buildPGUDisableChannelCommands(config: SharedDisableChannelConfig | undefined): DownlinkCommand[] {
  return buildNetris3DisableChannelCommands(NETRIS3_COMMANDS, config)
}

export function buildPGUProcessAlarmCommands(config: SharedProcessAlarmConfig | undefined): DownlinkCommand[] {
  return buildNetris3ProcessAlarmCommands(NETRIS3_COMMANDS, config)
}

export function buildPGUMeasureOffsetCommands(config: SharedMeasureOffsetConfig | undefined): DownlinkCommand[] {
  return buildNetris3MeasureOffsetCommands(NETRIS3_COMMANDS, config)
}

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
import { PEU_COMMANDS } from '../constants'

export type DownlinkCommand = number[]

const NETRIS3_COMMANDS = {
  resetFactory: PEU_COMMANDS.RESET_FACTORY,
  setMainConfig: PEU_COMMANDS.SET_MAIN_CONFIG,
  disableChannel: PEU_COMMANDS.DISABLE_CHANNEL,
  setProcessAlarm: PEU_COMMANDS.SET_PROCESS_ALARM,
  setChannelProperty: PEU_COMMANDS.SET_CHANNEL_PROPERTY,
} as const

export function buildResetFactoryCommand(): DownlinkCommand {
  return buildNetris3ResetFactoryCommand(NETRIS3_COMMANDS)
}

export function buildPEUMainConfigCommand(config: {
  measuringRateWhenNoAlarm: number
  publicationFactorWhenNoAlarm: number
  measuringRateWhenAlarm: number
  publicationFactorWhenAlarm: number
} | undefined, payloadLimit: number): DownlinkCommand[] {
  return buildNetris3MainConfigCommand(NETRIS3_COMMANDS, config, payloadLimit)
}

export function buildPEUDisableChannelCommands(config: SharedDisableChannelConfig | undefined): DownlinkCommand[] {
  return buildNetris3DisableChannelCommands(NETRIS3_COMMANDS, config)
}

export function buildPEUProcessAlarmCommands(config: SharedProcessAlarmConfig | undefined): DownlinkCommand[] {
  return buildNetris3ProcessAlarmCommands(NETRIS3_COMMANDS, config)
}

export function buildPEUMeasureOffsetCommands(config: SharedMeasureOffsetConfig | undefined): DownlinkCommand[] {
  return buildNetris3MeasureOffsetCommands(NETRIS3_COMMANDS, config)
}

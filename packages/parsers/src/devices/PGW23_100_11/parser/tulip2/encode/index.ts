import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type {
  PGW23_100_11TULIP2ConfigurationAction,
  PGW23_100_11TULIP2DownlinkExtraInput,
  PGW23_100_11TULIP2ResetBatteryAction,
} from '../../../schema/tulip2'
import type { PGWTulip2BaseDownlinkInput } from '../constants'
import type { DownlinkCommand } from './commands'
import type { DownlinkFrame } from './frames'
import { formatDisableChannelInput, formatMainConfigurationInput, formatProcessAlarmInput } from '../../../../../formatters'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { PGW_DEFAULT_BYTE_LIMIT, PGW_DEFAULT_CONFIGURATION_ID, PGW_DOWNLINK_FEATURE_FLAGS } from '../constants'
import { buildPGWDisableChannelCommands, buildPGWMainConfigCommand, buildPGWProcessAlarmCommands, buildResetBatteryCommand, buildResetFactoryCommand } from './commands'
import { buildPGWDownlinkFrame, buildPGWDownlinkFrames } from './frames'

type PGWTulip2DownlinkInput = PGWTulip2BaseDownlinkInput | PGW23_100_11TULIP2DownlinkExtraInput

export function PGWTULIP2EncodeHandler(formattedInput: PGWTulip2DownlinkInput): DownlinkOutput
export function PGWTULIP2EncodeHandler(formattedInput: PGWTulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function PGWTULIP2EncodeHandler(formattedInput: PGWTulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function PGWTULIP2EncodeHandler(formattedInput: PGWTulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
  switch (formattedInput.deviceAction) {
    case 'resetToFactory': {
      const frame = encodeResetToFactory()
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'resetBatteryIndicator': {
      const frame = encodeResetBatteryIndicator(formattedInput)
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'configuration':
      return encodeDownlinkConfiguration(formattedInput,
        // @ts-expect-error - overload resolution
        allowMultiple)

    default: {
      // @ts-expect-error - exhaustive check
      throw new Error(`Unknown device action: ${formattedInput.deviceAction}`)
    }
  }
}

function encodeResetToFactory(): DownlinkFrame {
  const command = buildResetFactoryCommand()
  return buildPGWDownlinkFrame([command], {
    configId: PGW_DEFAULT_CONFIGURATION_ID,
    maxConfigId: PGW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeResetBatteryIndicator(input: PGW23_100_11TULIP2ResetBatteryAction): DownlinkFrame {
  const configId = input.configurationId ?? PGW_DEFAULT_CONFIGURATION_ID
  const command = buildResetBatteryCommand()
  return buildPGWDownlinkFrame([command], {
    configId,
    maxConfigId: PGW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeDownlinkConfiguration(input: PGW23_100_11TULIP2ConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: PGW23_100_11TULIP2ConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: PGW23_100_11TULIP2ConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? PGW_DEFAULT_CONFIGURATION_ID
  const byteLimit = input.byteLimit ?? PGW_DEFAULT_BYTE_LIMIT

  const payloadLimit = byteLimit - 2

  const commands: DownlinkCommand[] = [
    ...buildPGWMainConfigCommand(formatMainConfigurationInput(input), payloadLimit),
    ...buildPGWDisableChannelCommands(formatDisableChannelInput(input)),
    ...buildPGWProcessAlarmCommands(formatProcessAlarmInput(input)),
  ]

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  if (allowMultiple) {
    const frames = buildPGWDownlinkFrames(commands, {
      configId,
      maxConfigId: PGW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
      byteLimit,
    })
    return formatMultipleDownlinkOutput(frames)
  }

  const frame = buildPGWDownlinkFrame(commands, {
    configId,
    byteLimit,
    maxConfigId: PGW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
  })
  return formatDownlinkOutput(frame)
}

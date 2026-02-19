import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type { TRUTulip2DownlinkInput } from '../constants'
import { formatDisableChannelInput, formatMainConfigurationInput, formatMeasureOffsetInput, formatProcessAlarmInput } from '../../../../../formatters'
import { buildDownlinkFrames } from '../../../../../utils/encoding/tuilp2/frames'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { TRU_DEFAULT_BYTE_LIMIT, TRU_DEFAULT_CONFIGURATION_ID, TRU_DOWNLINK_FEATURE_FLAGS } from '../constants'
import { buildResetFactoryCommand, buildTRUDisableChannelCommands, buildTRUMainConfigCommand, buildTRUMeasureOffsetCommands, buildTRUProcessAlarmCommands } from './commands'

type DownlinkCommand = number[]
type DownlinkConfigurationFrame = Extract<TRUTulip2DownlinkInput, { deviceAction: 'configuration' }>

export function TRUTULIP2EncodeHandler(formattedInput: TRUTulip2DownlinkInput): DownlinkOutput
export function TRUTULIP2EncodeHandler(formattedInput: TRUTulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function TRUTULIP2EncodeHandler(formattedInput: TRUTulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function TRUTULIP2EncodeHandler(formattedInput: TRUTulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
  switch (formattedInput.deviceAction) {
    case 'resetToFactory': {
      const frame = encodeResetToFactory()
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

function encodeResetToFactory(): number[] {
  const command = buildResetFactoryCommand()
  return [0, ...command]
}

function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? TRU_DEFAULT_CONFIGURATION_ID
  const byteLimit = input.byteLimit ?? TRU_DEFAULT_BYTE_LIMIT
  const payloadLimit = byteLimit - 1

  const commands: DownlinkCommand[] = [
    ...buildTRUMainConfigCommand(formatMainConfigurationInput(input), payloadLimit),
    ...buildTRUDisableChannelCommands(formatDisableChannelInput(input)),
    ...buildTRUProcessAlarmCommands(formatProcessAlarmInput(input)),
    ...buildTRUMeasureOffsetCommands(formatMeasureOffsetInput(input, TRU_DOWNLINK_FEATURE_FLAGS)),
  ]

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  const frames = buildDownlinkFrames(commands, {
    configId,
    maxConfigId: TRU_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit,
  })

  if (allowMultiple) {
    return formatMultipleDownlinkOutput(frames)
  }

  if (frames.length > 1) {
    throw new Error(
      `Encoding produced ${frames.length} frames but single encoder can only return one frame. Use encodeMultiple() or increase byteLimit.`,
    )
  }

  return formatDownlinkOutput(frames[0]!)
}

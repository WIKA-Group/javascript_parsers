import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type { GD20WTULIP2ConfigurationAction, GD20WTULIP2GetConfigurationAction, GD20WTULIP2ResetBatteryAction } from '../../../schema/tulip2'
import type { GD20WTulip2DownlinkInput } from '../constants'
import type { DownlinkCommand } from './commands'
import { formatDisableChannelInput, formatMainConfigurationInput, formatProcessAlarmInput } from '../../../../../formatters'
import { buildDownlinkFrame, buildDownlinkFrames } from '../../../../../utils/encoding/tuilp2/frames'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { GD20W_DEFAULT_BYTE_LIMIT, GD20W_DEFAULT_CONFIGURATION_ID, GD20W_DOWNLINK_FEATURE_FLAGS } from '../constants'
import { buildGD20WDisableChannelCommands, buildGD20WMainConfigCommand, buildGD20WProcessAlarmCommands, buildGetMainConfigCommand, buildGetProcessAlarmConfigCommand, buildResetBatteryCommand, buildResetFactoryCommand } from './commands'

export function GD20WTULIP2EncodeHandler(formattedInput: GD20WTulip2DownlinkInput): DownlinkOutput
export function GD20WTULIP2EncodeHandler(formattedInput: GD20WTulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function GD20WTULIP2EncodeHandler(formattedInput: GD20WTulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function GD20WTULIP2EncodeHandler(formattedInput: GD20WTulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
  switch (formattedInput.deviceAction) {
    case 'resetToFactory': {
      const frame = encodeResetToFactory()
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'resetBatteryIndicator': {
      const frame = encodeResetBatteryIndicator(formattedInput)
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'getConfiguration':
      return encodeGetConfiguration(formattedInput,
        // @ts-expect-error - overload resolution
        allowMultiple)

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
  return buildDownlinkFrame([buildResetFactoryCommand()], {
    configId: 0,
    maxConfigId: GD20W_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeResetBatteryIndicator(input: GD20WTULIP2ResetBatteryAction): number[] {
  const configId = input.configurationId ?? GD20W_DEFAULT_CONFIGURATION_ID
  return buildDownlinkFrame([buildResetBatteryCommand()], {
    configId,
    maxConfigId: GD20W_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeDownlinkConfiguration(input: GD20WTULIP2ConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: GD20WTULIP2ConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: GD20WTULIP2ConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? GD20W_DEFAULT_CONFIGURATION_ID
  const byteLimit = input.byteLimit ?? GD20W_DEFAULT_BYTE_LIMIT

  const commands: DownlinkCommand[] = [
    ...buildGD20WMainConfigCommand(formatMainConfigurationInput(input)),
    ...buildGD20WDisableChannelCommands(formatDisableChannelInput(input)),
    ...buildGD20WProcessAlarmCommands(formatProcessAlarmInput(input)),
  ]

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  if (allowMultiple) {
    const frames = buildDownlinkFrames(commands, {
      configId,
      maxConfigId: GD20W_DOWNLINK_FEATURE_FLAGS.maxConfigId,
      byteLimit,
    })
    return formatMultipleDownlinkOutput(frames)
  }

  const frame = buildDownlinkFrame(commands, {
    configId,
    maxConfigId: GD20W_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit,
  })
  return formatDownlinkOutput(frame)
}

function encodeGetConfiguration(input: GD20WTULIP2GetConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeGetConfiguration(input: GD20WTULIP2GetConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeGetConfiguration(input: GD20WTULIP2GetConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const commands: DownlinkCommand[] = []

  if (input.mainConfiguration) {
    commands.push(buildGetMainConfigCommand())
  }

  const addChannelGet = (channelId: 0 | 1 | 2 | 3 | 4 | 5, channel: unknown): void => {
    if (channel === true) {
      commands.push(buildGetProcessAlarmConfigCommand(channelId))
      return
    }
    if (channel && typeof channel === 'object' && 'alarms' in channel && (channel as { alarms?: boolean }).alarms) {
      commands.push(buildGetProcessAlarmConfigCommand(channelId))
    }
  }

  addChannelGet(0, input.channel0)
  addChannelGet(1, input.channel1)
  addChannelGet(2, input.channel2)
  addChannelGet(3, input.channel3)
  addChannelGet(4, input.channel4)
  addChannelGet(5, input.channel5)

  if (commands.length === 0) {
    throw new Error('No get configuration commands were provided.')
  }

  const configId = input.configurationId ?? GD20W_DEFAULT_CONFIGURATION_ID
  const byteLimit = input.byteLimit ?? Infinity
  const frame = buildDownlinkFrame(commands, {
    configId,
    maxConfigId: GD20W_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit,
  })

  if (allowMultiple) {
    return formatMultipleDownlinkOutput([frame])
  }
  return formatDownlinkOutput(frame)
}

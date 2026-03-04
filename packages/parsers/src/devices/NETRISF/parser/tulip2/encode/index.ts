import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type { NetrisFTULIP2ConfigurationAction, NetrisFTULIP2GetConfigurationAction, NetrisFTULIP2ResetBatteryAction } from '../../../schema/tulip2'
import type { NetrisFTulip2DownlinkInput } from '../constants'
import type { DownlinkCommand } from './commands'
import type { DownlinkFrame } from './frames'
import { formatMainConfigurationInput, formatMeasureOffsetInput, formatProcessAlarmInput } from '../../../../../formatters'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { NETRISF_DEFAULT_BYTE_LIMIT, NETRISF_DEFAULT_CONFIGURATION_ID, NETRISF_DOWNLINK_FEATURE_FLAGS } from '../constants'
import { buildGetAlarmConfigCommand, buildGetMainConfigCommand, buildGetPropertyCommand, buildNetrisFMainConfigCommand, buildNetrisFMeasureOffsetCommands, buildNetrisFProcessAlarmCommands, buildResetBatteryCommand, buildResetFactoryCommand } from './commands'
import { buildNetrisFDownlinkFrame, buildNetrisFDownlinkFrames } from './frames'

export function NETRISFTULIP2EncodeHandler(formattedInput: NetrisFTulip2DownlinkInput): DownlinkOutput
export function NETRISFTULIP2EncodeHandler(formattedInput: NetrisFTulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function NETRISFTULIP2EncodeHandler(formattedInput: NetrisFTulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function NETRISFTULIP2EncodeHandler(formattedInput: NetrisFTulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
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

function encodeResetToFactory(): DownlinkFrame {
  return buildNetrisFDownlinkFrame([buildResetFactoryCommand()], {
    configId: NETRISF_DEFAULT_CONFIGURATION_ID,
    maxConfigId: NETRISF_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeResetBatteryIndicator(input: NetrisFTULIP2ResetBatteryAction): DownlinkFrame {
  const configId = input.configurationId ?? NETRISF_DEFAULT_CONFIGURATION_ID
  return buildNetrisFDownlinkFrame([buildResetBatteryCommand()], {
    configId,
    maxConfigId: NETRISF_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeDownlinkConfiguration(input: NetrisFTULIP2ConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: NetrisFTULIP2ConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: NetrisFTULIP2ConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? NETRISF_DEFAULT_CONFIGURATION_ID
  const byteLimit = input.byteLimit ?? NETRISF_DEFAULT_BYTE_LIMIT

  const commands: DownlinkCommand[] = [
    ...buildNetrisFMainConfigCommand(formatMainConfigurationInput(input)),
    ...buildNetrisFProcessAlarmCommands(formatProcessAlarmInput(input)),
    ...buildNetrisFMeasureOffsetCommands(formatMeasureOffsetInput(input, NETRISF_DOWNLINK_FEATURE_FLAGS)),
  ]

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  if (allowMultiple) {
    const frames = buildNetrisFDownlinkFrames(commands, {
      configId,
      maxConfigId: NETRISF_DOWNLINK_FEATURE_FLAGS.maxConfigId,
      byteLimit,
    })
    return formatMultipleDownlinkOutput(frames)
  }

  const frame = buildNetrisFDownlinkFrame(commands, {
    configId,
    byteLimit,
    maxConfigId: NETRISF_DOWNLINK_FEATURE_FLAGS.maxConfigId,
  })
  return formatDownlinkOutput(frame)
}

function encodeGetConfiguration(input: NetrisFTULIP2GetConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeGetConfiguration(input: NetrisFTULIP2GetConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeGetConfiguration(input: NetrisFTULIP2GetConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const commands: DownlinkCommand[] = []

  if (input.mainConfiguration) {
    commands.push(buildGetMainConfigCommand())
  }

  if (input.channel0 === true) {
    commands.push(buildGetAlarmConfigCommand(0))
    commands.push(buildGetPropertyCommand(0))
  }
  else if (input.channel0 && typeof input.channel0 === 'object') {
    if (input.channel0.alarms) {
      commands.push(buildGetAlarmConfigCommand(0))
    }
    if (input.channel0.measureOffset) {
      commands.push(buildGetPropertyCommand(0))
    }
  }

  if (input.channel1 === true) {
    commands.push(buildGetAlarmConfigCommand(1))
    commands.push(buildGetPropertyCommand(1))
  }
  else if (input.channel1 && typeof input.channel1 === 'object') {
    if (input.channel1.alarms) {
      commands.push(buildGetAlarmConfigCommand(1))
    }
    if (input.channel1.measureOffset) {
      commands.push(buildGetPropertyCommand(1))
    }
  }

  if (commands.length === 0) {
    throw new Error('No get configuration commands were provided.')
  }

  const configId = input.configurationId ?? NETRISF_DEFAULT_CONFIGURATION_ID
  const byteLimit = input.byteLimit ?? Infinity
  const frame = buildNetrisFDownlinkFrame(commands, {
    configId,
    maxConfigId: NETRISF_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit,
  })

  if (allowMultiple) {
    return formatMultipleDownlinkOutput([frame])
  }
  return formatDownlinkOutput(frame)
}

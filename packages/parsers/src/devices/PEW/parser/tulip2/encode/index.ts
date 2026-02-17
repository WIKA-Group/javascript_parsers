import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type { PewTulip2DownlinkInput } from '../constants'
import type { DownlinkCommand } from './commands'
import type { DownlinkFrame } from './frames'
import { formatDisableChannelInput, formatMainConfigurationInput, formatMeasureOffsetInput, formatProcessAlarmInput } from '../../../../../formatters'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { PEW_DEFAULT_BYTE_LIMIT, PEW_DEFAULT_CONFIGURATION_ID, PEW_DOWNLINK_FEATURE_FLAGS } from '../constants'
import { buildDropOnAirCommand, buildGetAlarmConfigCommand, buildGetMainConfigCommand, buildGetPropertyCommand, buildPEWDisableChannelCommands, buildPEWMainConfigCommand, buildPEWMeasureOffsetCommands, buildPEWProcessAlarmCommands, buildResetBatteryCommand, buildResetFactoryCommand } from './commands'
import { buildPEWDownlinkFrame, buildPEWDownlinkFrames } from './frames'

export function PEWTULIP2EncodeHandler(formattedInput: PewTulip2DownlinkInput): DownlinkOutput
export function PEWTULIP2EncodeHandler(formattedInput: PewTulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function PEWTULIP2EncodeHandler(formattedInput: PewTulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function PEWTULIP2EncodeHandler(formattedInput: PewTulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
  switch (formattedInput.deviceAction) {
    case 'resetToFactory': {
      const frame = encodeResetToFactory()
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'resetBatteryIndicator': {
      const frame = encodeResetBatteryIndicator(formattedInput.configurationId)
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'dropConfiguration': {
      const frame = encodeDropConfiguration(formattedInput.configurationId)
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
  const command = buildResetFactoryCommand()
  return buildPEWDownlinkFrame([command], {
    configId: PEW_DEFAULT_CONFIGURATION_ID,
    maxConfigId: PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeResetBatteryIndicator(configId?: number): DownlinkFrame {
  configId ??= PEW_DEFAULT_CONFIGURATION_ID
  const command = buildResetBatteryCommand()
  return buildPEWDownlinkFrame([command], {
    configId,
    maxConfigId: PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeDropConfiguration(configId?: number): DownlinkFrame {
  configId ??= PEW_DEFAULT_CONFIGURATION_ID
  const command = buildDropOnAirCommand()
  return buildPEWDownlinkFrame([command], {
    configId,
    maxConfigId: PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

type DownlinkConfigurationFrame = PewTulip2DownlinkInput & { deviceAction: 'configuration' }

function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? PEW_DEFAULT_CONFIGURATION_ID

  const byteLimit = input.byteLimit ?? PEW_DEFAULT_BYTE_LIMIT

  // payloadLimit accounts for configId byte + packet index byte
  const payloadLimit = byteLimit - 2

  const commands: DownlinkCommand[] = [
    ...buildPEWMainConfigCommand(formatMainConfigurationInput(input), payloadLimit),
    ...buildPEWDisableChannelCommands(formatDisableChannelInput(input)),
    ...buildPEWProcessAlarmCommands(formatProcessAlarmInput(input)),
    ...buildPEWMeasureOffsetCommands(formatMeasureOffsetInput(input, PEW_DOWNLINK_FEATURE_FLAGS)),
  ]

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  if (allowMultiple) {
    const frames = buildPEWDownlinkFrames(commands, {
      configId,
      maxConfigId: PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
      byteLimit,
    })
    return formatMultipleDownlinkOutput(frames)
  }

  const frame = buildPEWDownlinkFrame(commands, {
    configId,
    byteLimit,
    maxConfigId: PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
  })
  return formatDownlinkOutput(frame)
}

// ─── Get configuration ──────────────────────────────────────────────────────────

type GetConfigurationAction = Extract<PewTulip2DownlinkInput, { deviceAction: 'getConfiguration' }>

function encodeGetConfiguration(input: GetConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeGetConfiguration(input: GetConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeGetConfiguration(input: GetConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
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

  const configId = PEW_DEFAULT_CONFIGURATION_ID
  const frame = buildPEWDownlinkFrame(commands, {
    configId,
    maxConfigId: PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })

  if (allowMultiple) {
    return formatMultipleDownlinkOutput([frame])
  }
  return formatDownlinkOutput(frame)
}

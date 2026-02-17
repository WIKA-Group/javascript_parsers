import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type { DownlinkCommand, DownlinkFrame } from '../../../../../utils/encoding/tuilp2/frames'
import type { Netris2Tulip2DownlinkInput } from '../constants'
import { formatDisableChannelInput, formatMainConfigurationInput, formatMeasureOffsetInput, formatProcessAlarmInput, formatStartupTimeInput } from '../../../../../formatters'
import { DEFAULT_BYTE_LIMIT, DEFAULT_CONFIGURATION_ID } from '../../../../../utils/encoding/tuilp2/constants'
import { buildDisableChannelCommands } from '../../../../../utils/encoding/tuilp2/disableChannel'
import { buildDownlinkFrame, buildDownlinkFrames } from '../../../../../utils/encoding/tuilp2/frames'
import { buildMainConfigurationCommands } from '../../../../../utils/encoding/tuilp2/mainConfig'
import { buildMeasureOffsetCommands } from '../../../../../utils/encoding/tuilp2/offset'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { buildProcessAlarmCommands } from '../../../../../utils/encoding/tuilp2/processAlarm'
import { buildResetBatteryIndicatorCommand } from '../../../../../utils/encoding/tuilp2/resetBatteryIndicator'
import { buildResetToFactoryCommand } from '../../../../../utils/encoding/tuilp2/resetToFactory'
import { buildStartupTimeCommands } from '../../../../../utils/encoding/tuilp2/startupTime'
import { NETRIS2_DOWNLINK_FEATURE_FLAGS } from '../constants'

export function NETRIS2TULIP2EncodeHandler(formattedInput: Netris2Tulip2DownlinkInput): DownlinkOutput
export function NETRIS2TULIP2EncodeHandler(formattedInput: Netris2Tulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function NETRIS2TULIP2EncodeHandler(formattedInput: Netris2Tulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function NETRIS2TULIP2EncodeHandler(formattedInput: Netris2Tulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
  switch (formattedInput.deviceAction) {
    case 'resetToFactory': {
      const frame = encodeResetToFactory()
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'resetBatteryIndicator': {
      const frame = encodeResetBatteryIndicator(formattedInput.configurationId)
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'configuration':
      return encodeDownlinkConfiguration(formattedInput,
        // @ts-expect-error - overload resolution
        allowMultiple)

    default: {
      // @ts-expect-error - exhaustive check
      throw new Error(`Unknown device action: ${formatted.deviceAction}`)
    }
  }
}

function encodeResetToFactory(): DownlinkFrame {
  const command = buildResetToFactoryCommand()
  return buildDownlinkFrame([command], {
    configId: 0,
    maxConfigId: NETRIS2_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    // Infinity as it will never exceed the byte limit
    byteLimit: Infinity,
  })
}

function encodeResetBatteryIndicator(configId?: number): DownlinkFrame {
  configId ??= DEFAULT_CONFIGURATION_ID
  const command = buildResetBatteryIndicatorCommand()
  return buildDownlinkFrame([command], {
    configId,
    maxConfigId: NETRIS2_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    // Infinity as it will never exceed the byte limit
    byteLimit: Infinity,
  })
}

type DownlinkConfigurationFrame = Netris2Tulip2DownlinkInput & { deviceAction: 'configuration' }

function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? DEFAULT_CONFIGURATION_ID

  const byteLimit = input.byteLimit ?? DEFAULT_BYTE_LIMIT

  const payloadLimit = byteLimit - 1

  const commands: DownlinkCommand[] = [
    ...buildMainConfigurationCommands(formatMainConfigurationInput(input), payloadLimit),
    ...buildDisableChannelCommands(formatDisableChannelInput(input), payloadLimit),
    ...buildProcessAlarmCommands(formatProcessAlarmInput(input), payloadLimit),
    ...buildMeasureOffsetCommands(formatMeasureOffsetInput(input, NETRIS2_DOWNLINK_FEATURE_FLAGS), payloadLimit),
    ...buildStartupTimeCommands(formatStartupTimeInput(input, NETRIS2_DOWNLINK_FEATURE_FLAGS), payloadLimit),
  ]

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  if (allowMultiple) {
    const frames = buildDownlinkFrames(commands, {
      configId,
      maxConfigId: NETRIS2_DOWNLINK_FEATURE_FLAGS.maxConfigId,
      byteLimit,
    })
    return formatMultipleDownlinkOutput(frames)
  }

  const frame = buildDownlinkFrame(commands, {
    configId,
    byteLimit,
    maxConfigId: NETRIS2_DOWNLINK_FEATURE_FLAGS.maxConfigId,
  })
  return formatDownlinkOutput(frame)
}

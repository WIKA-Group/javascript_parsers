import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../../../types'
import type { NETRIS1Tulip2DownlinkInput } from '../constants'
import { formatMainConfigurationInput, formatProcessAlarmInput } from '../../../../../formatters'
import { pushUint16, pushUint32 } from '../../../../../utils/encoding/push'
import { buildDownlinkFrame, buildDownlinkFrames } from '../../../../../utils/encoding/tuilp2/frames'
import { formatDownlinkOutput, formatMultipleDownlinkOutput } from '../../../../../utils/encoding/tuilp2/output'
import { NETRIS1_COMMANDS, NETRIS1_DEFAULT_BYTE_LIMIT, NETRIS1_DEFAULT_CONFIGURATION_ID, NETRIS1_DOWNLINK_FEATURE_FLAGS } from '../constants'

type DownlinkCommand = number[]
type DownlinkFrame = number[]

type DownlinkConfigurationFrame = Extract<NETRIS1Tulip2DownlinkInput, { deviceAction: 'configuration' }>
type GetConfigurationAction = Extract<NETRIS1Tulip2DownlinkInput, { deviceAction: 'getConfiguration' }>

function buildMainConfigCommand(
  config: DownlinkConfigurationFrame['mainConfiguration'],
): DownlinkCommand {
  if (!config) {
    return []
  }

  const noAlarmTotalInterval = config.measuringRateWhenNoAlarm * config.publicationFactorWhenNoAlarm
  const alarmTotalInterval = config.measuringRateWhenAlarm * config.publicationFactorWhenAlarm

  if (config.measuringRateWhenNoAlarm < 2 || config.measuringRateWhenNoAlarm > 604_800) {
    throw new Error('measuringRateWhenNoAlarm must be between 2 and 604800 seconds.')
  }

  if (config.measuringRateWhenAlarm < 2 || config.measuringRateWhenAlarm > 604_800) {
    throw new Error('measuringRateWhenAlarm must be between 2 and 604800 seconds.')
  }

  if (config.publicationFactorWhenNoAlarm < 1 || config.publicationFactorWhenNoAlarm > 604_800) {
    throw new Error('publicationFactorWhenNoAlarm must be between 1 and 604800.')
  }

  if (config.publicationFactorWhenAlarm < 1 || config.publicationFactorWhenAlarm > 604_800) {
    throw new Error('publicationFactorWhenAlarm must be between 1 and 604800.')
  }

  if (noAlarmTotalInterval > 604_800) {
    throw new Error('The product of measuringRateWhenNoAlarm and publicationFactorWhenNoAlarm must not exceed 604_800 seconds (7 days).')
  }

  if (alarmTotalInterval > 604_800) {
    throw new Error('The product of measuringRateWhenAlarm and publicationFactorWhenAlarm must not exceed 604_800 seconds (7 days).')
  }

  const bytes: number[] = [NETRIS1_COMMANDS.SET_MAIN_CONFIG]

  pushUint32(bytes, config.measuringRateWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint32(bytes, config.measuringRateWhenAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)

  bytes.push(0x00)

  return bytes
}

function buildProcessAlarmCommand(
  config: ReturnType<typeof formatProcessAlarmInput>,
): DownlinkCommand {
  const channel0 = config?.channel0
  if (channel0 === undefined) {
    return []
  }

  const alarms = channel0

  const bytes: number[] = [NETRIS1_COMMANDS.SET_PROCESS_ALARM, 0x00]

  if (alarms === true) {
    bytes.push(0x00, 0x00)
    bytes.push(0x00)
    return bytes
  }

  pushUint16(bytes, alarms.deadBand)

  let alarmMask = 0
  if (alarms.lowThreshold !== undefined)
    alarmMask |= 0x80
  if (alarms.highThreshold !== undefined)
    alarmMask |= 0x40
  if (alarms.fallingSlope !== undefined)
    alarmMask |= 0x20
  if (alarms.risingSlope !== undefined)
    alarmMask |= 0x10
  if (alarms.lowThresholdWithDelay !== undefined)
    alarmMask |= 0x08
  if (alarms.highThresholdWithDelay !== undefined)
    alarmMask |= 0x04

  bytes.push(alarmMask)

  if (alarms.lowThreshold !== undefined)
    pushUint16(bytes, alarms.lowThreshold)
  if (alarms.highThreshold !== undefined)
    pushUint16(bytes, alarms.highThreshold)
  if (alarms.fallingSlope !== undefined)
    pushUint16(bytes, alarms.fallingSlope)
  if (alarms.risingSlope !== undefined)
    pushUint16(bytes, alarms.risingSlope)
  if (alarms.lowThresholdWithDelay !== undefined) {
    pushUint16(bytes, alarms.lowThresholdWithDelay.value)
    pushUint16(bytes, alarms.lowThresholdWithDelay.delay)
  }
  if (alarms.highThresholdWithDelay !== undefined) {
    pushUint16(bytes, alarms.highThresholdWithDelay.value)
    pushUint16(bytes, alarms.highThresholdWithDelay.delay)
  }

  return bytes
}

export function NETRIS1TULIP2EncodeHandler(formattedInput: NETRIS1Tulip2DownlinkInput): DownlinkOutput
export function NETRIS1TULIP2EncodeHandler(formattedInput: NETRIS1Tulip2DownlinkInput, allowMultiple: false): DownlinkOutput
export function NETRIS1TULIP2EncodeHandler(formattedInput: NETRIS1Tulip2DownlinkInput, allowMultiple: true): MultipleDownlinkOutput
export function NETRIS1TULIP2EncodeHandler(formattedInput: NETRIS1Tulip2DownlinkInput, allowMultiple = false): DownlinkOutput | MultipleDownlinkOutput {
  switch (formattedInput.deviceAction) {
    case 'resetToFactory': {
      const frame = encodeResetToFactory()
      return allowMultiple ? formatMultipleDownlinkOutput([frame]) : formatDownlinkOutput(frame)
    }

    case 'resetBatteryIndicator': {
      const frame = encodeResetBatteryIndicator(formattedInput.configurationId)
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
  const command = [NETRIS1_COMMANDS.RESET_FACTORY]
  return buildDownlinkFrame([command], {
    configId: NETRIS1_DEFAULT_CONFIGURATION_ID,
    maxConfigId: NETRIS1_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeResetBatteryIndicator(configId?: number): DownlinkFrame {
  configId ??= NETRIS1_DEFAULT_CONFIGURATION_ID
  const command = [NETRIS1_COMMANDS.RESET_BATTERY, 0x00]
  return buildDownlinkFrame([command], {
    configId,
    maxConfigId: NETRIS1_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })
}

function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: false): DownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: true): MultipleDownlinkOutput
function encodeDownlinkConfiguration(input: DownlinkConfigurationFrame, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const configId = input.configurationId ?? NETRIS1_DEFAULT_CONFIGURATION_ID

  const byteLimit = input.byteLimit ?? NETRIS1_DEFAULT_BYTE_LIMIT

  const commands: DownlinkCommand[] = []

  const mainConfig = buildMainConfigCommand(formatMainConfigurationInput(input))
  if (mainConfig.length > 0) {
    commands.push(mainConfig)
  }

  const processAlarmConfig = buildProcessAlarmCommand(formatProcessAlarmInput(input))
  if (processAlarmConfig.length > 0) {
    commands.push(processAlarmConfig)
  }

  if (commands.length === 0) {
    throw new Error('No configuration commands were provided for the downlink frame.')
  }

  const frames = buildDownlinkFrames(commands, {
    configId,
    maxConfigId: NETRIS1_DOWNLINK_FEATURE_FLAGS.maxConfigId,
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

function encodeGetConfiguration(input: GetConfigurationAction, allowMultiple: false): DownlinkOutput
function encodeGetConfiguration(input: GetConfigurationAction, allowMultiple: true): MultipleDownlinkOutput
function encodeGetConfiguration(input: GetConfigurationAction, allowMultiple: boolean): DownlinkOutput | MultipleDownlinkOutput {
  const commands: DownlinkCommand[] = []

  if (input.mainConfiguration) {
    commands.push([NETRIS1_COMMANDS.GET_MAIN_CONFIG])
  }

  if (input.processAlarmConfiguration) {
    commands.push([NETRIS1_COMMANDS.GET_PROCESS_ALARM, 0x00])
  }

  if (commands.length === 0) {
    throw new Error('No get configuration commands were provided.')
  }

  const configId = NETRIS1_DEFAULT_CONFIGURATION_ID
  const frame = buildDownlinkFrame(commands, {
    configId,
    maxConfigId: NETRIS1_DOWNLINK_FEATURE_FLAGS.maxConfigId,
    byteLimit: Infinity,
  })

  if (allowMultiple) {
    return formatMultipleDownlinkOutput([frame])
  }
  return formatDownlinkOutput(frame)
}

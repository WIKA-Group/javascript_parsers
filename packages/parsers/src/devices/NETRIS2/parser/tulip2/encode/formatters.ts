import type { DisableChannelConfig } from '../../../../../utils/encoding/tuilp2/disableChannel'
import type { MainConfiguration } from '../../../../../utils/encoding/tuilp2/mainConfig'
import type { ChannelPropertyConfig } from '../../../../../utils/encoding/tuilp2/offset'
import type { ProcessAlarmConfig } from '../../../../../utils/encoding/tuilp2/processAlarm'
import type { StartUpTimeConfig } from '../../../../../utils/encoding/tuilp2/startupTime'
import type { Netris2Tulip2DownlinkInput } from '../constants'

type Netris2Tulip2DownlinkConfigurationFrame = Extract<Netris2Tulip2DownlinkInput, { deviceAction: 'configuration' }>

/**
 * Formats the main configuration from downlink input to the format expected by buildMainConfigurationCommands.
 */
export function formatMainConfigurationInput(
  input: Netris2Tulip2DownlinkConfigurationFrame,
): MainConfiguration | undefined {
  return input.mainConfiguration
}

/**
 * Formats the disable channel configuration from downlink input to the format expected by buildDisableChannelCommands.
 * @param input - The downlink configuration frame
 * @returns DisableChannelConfig where `true` means the channel will be **disabled**, `false` means the channel stays **enabled**
 * @note Only returns channels that should be explicitly disabled (set to `false` in the input)
 */
export function formatDisableChannelInput(
  input: Netris2Tulip2DownlinkConfigurationFrame,
): DisableChannelConfig | undefined {
  const config: DisableChannelConfig = {}
  let hasConfig = false

  // Only include channels that are explicitly set to false (disabled in input)
  if (input.channel0 === false) {
    config.channel0 = true // true = disable the channel
    hasConfig = true
  }

  if (input.channel1 === false) {
    config.channel1 = true // true = disable the channel
    hasConfig = true
  }

  return hasConfig ? config : undefined
}

/**
 * Formats the process alarm configuration from downlink input to the format expected by buildProcessAlarmCommands.
 */
export function formatProcessAlarmInput(
  input: Netris2Tulip2DownlinkConfigurationFrame,
): ProcessAlarmConfig | undefined {
  const config: ProcessAlarmConfig = {}
  let hasConfig = false

  if (input.channel0) {
    if (input.channel0 === true) {
      config.channel0 = input.channel0
      hasConfig = true
    }
    else if (typeof input.channel0.alarms === 'object') {
      config.channel0 = input.channel0.alarms
      hasConfig = true
    }
  }

  if (input.channel1) {
    if (input.channel1 === true) {
      config.channel1 = input.channel1
      hasConfig = true
    }
    else if (typeof input.channel1.alarms === 'object') {
      config.channel1 = input.channel1.alarms
      hasConfig = true
    }
  }

  return hasConfig ? config : undefined
}

/**
 * Formats the channel property (offset) configuration from downlink input to the format expected by buildMeasureOffsetCommands.
 */
export function formatMeasureOffsetInput(
  input: Netris2Tulip2DownlinkConfigurationFrame,
): ChannelPropertyConfig | undefined {
  const config: ChannelPropertyConfig = {}
  let hasConfig = false

  if (input.channel0 && typeof input.channel0 === 'object' && input.channel0.measureOffset !== undefined) {
    config.channel0 = {
      offset: input.channel0.measureOffset,
    }
    hasConfig = true
  }

  if (input.channel1 && typeof input.channel1 === 'object' && input.channel1.measureOffset !== undefined) {
    config.channel1 = {
      offset: input.channel1.measureOffset,
    }
    hasConfig = true
  }

  return hasConfig ? config : undefined
}

/**
 * Formats the startup time configuration from downlink input to the format expected by buildStartupTimeCommands.
 */
export function formatStartupTimeInput(
  input: Netris2Tulip2DownlinkConfigurationFrame,
): StartUpTimeConfig | undefined {
  const config: StartUpTimeConfig = {}
  let hasConfig = false

  if (input.channel0 && typeof input.channel0 === 'object' && input.channel0.startUpTime !== undefined) {
    config.channel0 = {
      startUpTime: input.channel0.startUpTime,
    }
    hasConfig = true
  }

  if (input.channel1 && typeof input.channel1 === 'object' && input.channel1.startUpTime !== undefined) {
    config.channel1 = {
      startUpTime: input.channel1.startUpTime,
    }
    hasConfig = true
  }

  return hasConfig ? config : undefined
}

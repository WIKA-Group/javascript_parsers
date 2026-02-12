import type { PewTulip2DownlinkInput } from '../constants'
import type { PEWDisableChannelConfig, PEWMainConfiguration, PEWMeasureOffsetConfig, PEWProcessAlarmConfig } from './commands'

type PewTulip2DownlinkConfigurationFrame = Extract<PewTulip2DownlinkInput, { deviceAction: 'configuration' }>

/**
 * Formats the main configuration from downlink input to the format expected by buildPEWMainConfigCommand.
 */
export function formatMainConfigurationInput(
  input: PewTulip2DownlinkConfigurationFrame,
): PEWMainConfiguration | undefined {
  if (!input.mainConfiguration) {
    return undefined
  }
  return input.mainConfiguration
}

/**
 * Formats the disable channel configuration from downlink input.
 * @param input - The downlink configuration frame
 * @returns PEWDisableChannelConfig where `true` means the channel will be **disabled**
 */
export function formatDisableChannelInput(
  input: PewTulip2DownlinkConfigurationFrame,
): PEWDisableChannelConfig | undefined {
  const config: PEWDisableChannelConfig = {}
  let hasConfig = false

  // channel0 === false in input means "disable the channel"
  if (input.channel0 === false) {
    config.channel0 = true // true = disable the channel
    hasConfig = true
  }

  // channel1 === false in input means "disable the channel"
  if (input.channel1 === false) {
    config.channel1 = true // true = disable the channel
    hasConfig = true
  }

  return hasConfig ? config : undefined
}

/**
 * Formats the process alarm configuration from downlink input.
 */
export function formatProcessAlarmInput(
  input: PewTulip2DownlinkConfigurationFrame,
): PEWProcessAlarmConfig | undefined {
  const config: PEWProcessAlarmConfig = {}
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
 * Formats the channel property (offset) configuration from downlink input.
 */
export function formatMeasureOffsetInput(
  input: PewTulip2DownlinkConfigurationFrame,
): PEWMeasureOffsetConfig | undefined {
  const config: PEWMeasureOffsetConfig = {}
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

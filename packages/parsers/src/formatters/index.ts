export interface ChannelAlarmConfig {
  deadBand: number
  lowThreshold?: number
  highThreshold?: number
  lowThresholdWithDelay?: {
    value: number
    delay: number
  }
  highThresholdWithDelay?: {
    value: number
    delay: number
  }
  risingSlope?: number
  fallingSlope?: number
}

type ChannelKey = `channel${number}`

interface ChannelConfigObject {
  alarms?: ChannelAlarmConfig
  measureOffset?: number
  startUpTime?: number
}

type ChannelConfig = true | ChannelConfigObject

export interface BaseConfigurationInput<TMainConfiguration> {
  mainConfiguration?: TMainConfiguration
  [key: ChannelKey]: false | ChannelConfig
}

export interface FormatterFeatureFlags {
  channelsStartupTime?: boolean
  channelsMeasureOffset?: boolean
}

export interface SharedDisableChannelConfig {
  [key: ChannelKey]: boolean
}

export interface SharedProcessAlarmConfig {
  [key: ChannelKey]: true | ChannelAlarmConfig
}

export interface SharedMeasureOffsetConfig {
  [key: ChannelKey]: { offset: number }
}

export interface SharedStartUpTimeConfig {
  [key: ChannelKey]: { startUpTime: number }
}

function getChannelKeys(input: BaseConfigurationInput<unknown>): ChannelKey[] {
  return Object.keys(input)
    .filter((key): key is ChannelKey => /^channel\d+$/.test(key))
}

export function formatMainConfigurationInput<TMainConfiguration>(
  input: BaseConfigurationInput<TMainConfiguration>,
): TMainConfiguration | undefined {
  return input.mainConfiguration
}

export function formatDisableChannelInput(
  input: BaseConfigurationInput<unknown>,
): SharedDisableChannelConfig | undefined {
  const config: SharedDisableChannelConfig = {}
  let hasConfig = false

  const channelKeys = getChannelKeys(input)
  for (const key of channelKeys) {
    if (input[key] === false) {
      config[key] = true
      hasConfig = true
    }
  }

  return hasConfig ? config : undefined
}

export function formatProcessAlarmInput(
  input: BaseConfigurationInput<unknown>,
): SharedProcessAlarmConfig | undefined {
  const config: SharedProcessAlarmConfig = {}
  let hasConfig = false

  const channelKeys = getChannelKeys(input)
  for (const key of channelKeys) {
    const channelValue = input[key]
    if (!channelValue) {
      continue
    }

    if (channelValue === true) {
      config[key] = true
      hasConfig = true
    }
    else if (typeof channelValue === 'object' && 'alarms' in channelValue && typeof channelValue.alarms === 'object') {
      config[key] = channelValue.alarms as ChannelAlarmConfig
      hasConfig = true
    }
  }

  return hasConfig ? config : undefined
}

export function formatMeasureOffsetInput(
  input: BaseConfigurationInput<unknown>,
  featureFlags?: FormatterFeatureFlags,
): SharedMeasureOffsetConfig | undefined {
  if (featureFlags?.channelsMeasureOffset === false) {
    return undefined
  }

  const config: SharedMeasureOffsetConfig = {}
  let hasConfig = false

  const channelKeys = getChannelKeys(input)
  for (const key of channelKeys) {
    const channelValue = input[key]
    if (channelValue && typeof channelValue === 'object' && 'measureOffset' in channelValue && channelValue.measureOffset !== undefined) {
      config[key] = {
        offset: channelValue.measureOffset as number,
      }
      hasConfig = true
    }
  }

  return hasConfig ? config : undefined
}

export function formatStartupTimeInput(
  input: BaseConfigurationInput<unknown>,
  featureFlags?: FormatterFeatureFlags,
): SharedStartUpTimeConfig | undefined {
  if (featureFlags?.channelsStartupTime === false) {
    return undefined
  }

  const config: SharedStartUpTimeConfig = {}
  let hasConfig = false

  const channelKeys = getChannelKeys(input)
  for (const key of channelKeys) {
    const channelValue = input[key]
    if (channelValue && typeof channelValue === 'object' && 'startUpTime' in channelValue && channelValue.startUpTime !== undefined) {
      config[key] = {
        startUpTime: channelValue.startUpTime as number,
      }
      hasConfig = true
    }
  }

  return hasConfig ? config : undefined
}

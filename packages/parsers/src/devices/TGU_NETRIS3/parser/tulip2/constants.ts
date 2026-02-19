import type { TULIP2DownlinkInput, Tulip2DownlinkSpanLimitFactors, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'
import type { createTULIP2TGUChannels } from './channels'

export const TGU_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 31,
  channelsStartupTime: false,
  channelsMeasureOffset: true,
  mainConfigBLE: false,
  mainConfigSingleMeasuringRate: false,
} as const satisfies Tulip2EncodeFeatureFlags

export const TGU_DOWNLINK_SPAN_LIMIT_FACTORS = {
  deadBandMaxSpanFactor: 1,
  slopeMaxSpanFactor: 1,
  measureOffsetMinSpanFactor: 1,
  measureOffsetMaxSpanFactor: 1,
} as const satisfies Tulip2DownlinkSpanLimitFactors

export type TGUTulip2FeatureFlags = typeof TGU_DOWNLINK_FEATURE_FLAGS
export type TGUTulip2Channels = ReturnType<typeof createTULIP2TGUChannels>

export type TGUTulip2DownlinkInput
  = TULIP2DownlinkInput<TGUTulip2Channels[number], typeof TGU_DOWNLINK_FEATURE_FLAGS>

export const TGU_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  DISABLE_CHANNEL: 0x11,
  SET_PROCESS_ALARM: 0x20,
  SET_CHANNEL_PROPERTY: 0x30,
} as const

export const TGU_DEFAULT_CONFIGURATION_ID = 1
export const TGU_DEFAULT_BYTE_LIMIT = 51

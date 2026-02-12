import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type {
  TULIP2DownlinkInput,
  Tulip2DownlinkSpanLimitFactors,
  Tulip2EncodeFeatureFlags,
} from '../../../../schemas/tulip2/downlink'

export const NETRIS2TULIP2_CHANNEL_0 = {
  name: 'Electrical current1' as const,
  channelId: 0 as const,
  defaultRange: {
    start: 4 as number,
    end: 20 as number,
  },
} as const

export const NETRIS2TULIP2_CHANNEL_1 = {
  name: 'Electrical current2' as const,
  channelId: 1 as const,
  defaultRange: {
    start: 4 as number,
    end: 20 as number,
  },
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2NETRIS2Channels() {
  return [
    {
      channelId: NETRIS2TULIP2_CHANNEL_0.channelId,
      name: NETRIS2TULIP2_CHANNEL_0.name,
      start: NETRIS2TULIP2_CHANNEL_0.defaultRange.start,
      end: NETRIS2TULIP2_CHANNEL_0.defaultRange.end,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: NETRIS2TULIP2_CHANNEL_1.channelId,
      name: NETRIS2TULIP2_CHANNEL_1.name,
      start: NETRIS2TULIP2_CHANNEL_1.defaultRange.start,
      end: NETRIS2TULIP2_CHANNEL_1.defaultRange.end,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

export const NETRIS2_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 31,
  channelsStartupTime: true,
  channelsMeasureOffset: true,
} as const satisfies Tulip2EncodeFeatureFlags

export const NETRIS2_DOWNLINK_SPAN_LIMIT_FACTORS = {
  deadBandMaxSpanFactor: 0.2,
  slopeMaxSpanFactor: 0.5,
  measureOffsetMinSpanFactor: 0.05,
  measureOffsetMaxSpanFactor: 0.05,
} as const satisfies Tulip2DownlinkSpanLimitFactors

export type Netris2Tulip2FeatureFlags = typeof NETRIS2_DOWNLINK_FEATURE_FLAGS
export type Netris2Tulip2Channels = ReturnType<typeof createTULIP2NETRIS2Channels>
export type Netris2Tulip2DownlinkInput = TULIP2DownlinkInput<Netris2Tulip2Channels[number], typeof NETRIS2_DOWNLINK_FEATURE_FLAGS>

import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type { TULIP2DownlinkInput, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'

export const PGWTULIP2_CHANNEL_0 = {
  name: 'pressure' as const,
  channelId: 0 as const,
  defaultRange: {
    start: 0 as number,
    end: 10 as number,
  },
} as const

export const PGWTULIP2_CHANNEL_1 = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  defaultRange: {
    start: -40 as number,
    end: 60 as number,
  },
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2PGWChannels() {
  return [
    {
      channelId: PGWTULIP2_CHANNEL_0.channelId,
      name: PGWTULIP2_CHANNEL_0.name,
      start: PGWTULIP2_CHANNEL_0.defaultRange.start,
      end: PGWTULIP2_CHANNEL_0.defaultRange.end,
    },
    {
      channelId: PGWTULIP2_CHANNEL_1.channelId,
      name: PGWTULIP2_CHANNEL_1.name,
      start: PGWTULIP2_CHANNEL_1.defaultRange.start,
      end: PGWTULIP2_CHANNEL_1.defaultRange.end,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

export const PGW_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 127,
  channelsStartupTime: false,
  channelsMeasureOffset: false,
  channelsBooleanOnly: ['channel1'],
  mainConfigBLE: false,
  mainConfigSingleMeasuringRate: true,
} as const satisfies Tulip2EncodeFeatureFlags

export type PGWTulip2FeatureFlags = typeof PGW_DOWNLINK_FEATURE_FLAGS
export type PGWTulip2Channels = ReturnType<typeof createTULIP2PGWChannels>

export type PGWTulip2BaseDownlinkInput = TULIP2DownlinkInput<PGWTulip2Channels[number], typeof PGW_DOWNLINK_FEATURE_FLAGS>

export const PGW_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  DISABLE_PRESSURE: 0x10,
  DISABLE_TEMPERATURE: 0x11,
  SET_PRESSURE_ALARM: 0x20,
  RESET_BATTERY: 0x40,
} as const

export const PGW_DEFAULT_CONFIGURATION_ID = 1
export const PGW_DEFAULT_BYTE_LIMIT = 51

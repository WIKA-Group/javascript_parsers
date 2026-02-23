import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type { TULIP2DownlinkInput, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'
import type { TRWTULIP2DownlinkExtraInput } from '../../schema/tulip2'

export const TRWTULIP2_CHANNEL_0 = {
  name: 'temperature' as const,
  channelId: 0 as const,
  defaultRange: {
    start: 0 as number,
    end: 10 as number,
  },
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2TRWChannels() {
  return [
    {
      channelId: TRWTULIP2_CHANNEL_0.channelId,
      name: TRWTULIP2_CHANNEL_0.name,
      start: TRWTULIP2_CHANNEL_0.defaultRange.start,
      end: TRWTULIP2_CHANNEL_0.defaultRange.end,
    },
  ] as const satisfies TULIP2Channel[]
}

export const TRW_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 31,
  channelsStartupTime: false,
  channelsMeasureOffset: false,
  mainConfigBLE: false,
  mainConfigSingleMeasuringRate: false,
} as const satisfies Tulip2EncodeFeatureFlags

export type TRWTulip2FeatureFlags = typeof TRW_DOWNLINK_FEATURE_FLAGS
export type TRWTulip2Channels = ReturnType<typeof createTULIP2TRWChannels>

export type TRWTulip2DownlinkInput
  = | TULIP2DownlinkInput<TRWTulip2Channels[number], typeof TRW_DOWNLINK_FEATURE_FLAGS>
    | TRWTULIP2DownlinkExtraInput

/**
 * TRW TULIP2 downlink command bytes.
 * Format: Transaction ID + Command Type + Command Options
 */
export const TRW_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  GET_MAIN_CONFIG: 0x04,
  RESET_BATTERY: 0x05,
  SET_PROCESS_ALARM: 0x20,
  GET_PROCESS_ALARM: 0x40,
} as const

export const TRW_DEFAULT_CONFIGURATION_ID = 1
export const TRW_DEFAULT_BYTE_LIMIT = 51

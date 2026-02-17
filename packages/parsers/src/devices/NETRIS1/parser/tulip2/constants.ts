import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type { TULIP2DownlinkInput, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'
import type { NETRIS1TULIP2DownlinkExtraInput } from '../../schema/tulip2'

export const NETRIS1TULIP2_CHANNEL_0 = {
  name: 'measurement' as const,
  channelId: 0 as const,
  defaultRange: {
    start: 0 as number,
    end: 10 as number,
  },
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2NETRIS1Channels() {
  return [
    {
      channelId: NETRIS1TULIP2_CHANNEL_0.channelId,
      name: NETRIS1TULIP2_CHANNEL_0.name,
      start: NETRIS1TULIP2_CHANNEL_0.defaultRange.start,
      end: NETRIS1TULIP2_CHANNEL_0.defaultRange.end,
    },
  ] as const satisfies TULIP2Channel[]
}

export const NETRIS1_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 31,
  channelsStartupTime: false,
  channelsMeasureOffset: false,
  mainConfigBLE: false,
  mainConfigSingleMeasuringRate: false,
} as const satisfies Tulip2EncodeFeatureFlags

export type NETRIS1Tulip2FeatureFlags = typeof NETRIS1_DOWNLINK_FEATURE_FLAGS
export type NETRIS1Tulip2Channels = ReturnType<typeof createTULIP2NETRIS1Channels>

export type NETRIS1Tulip2DownlinkInput
  = | TULIP2DownlinkInput<NETRIS1Tulip2Channels[number], typeof NETRIS1_DOWNLINK_FEATURE_FLAGS>
    | NETRIS1TULIP2DownlinkExtraInput

/**
 * NETRIS1 TULIP2 downlink command bytes.
 * Format: Transaction ID + Command Type + Command Options
 * Different from PEW in that it uses simpler command structure without per-channel IDs.
 */
export const NETRIS1_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  GET_MAIN_CONFIG: 0x04,
  RESET_BATTERY: 0x05,
  SET_PROCESS_ALARM: 0x20,
  GET_PROCESS_ALARM: 0x40,
} as const

export const NETRIS1_DEFAULT_CONFIGURATION_ID = 1
export const NETRIS1_DEFAULT_BYTE_LIMIT = 51

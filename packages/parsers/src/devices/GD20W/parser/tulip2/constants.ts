import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type { TULIP2DownlinkInput, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'
import type { GD20WTULIP2DownlinkExtraInput } from '../../schema/tulip2'
import { createGD20WTULIP2Channels } from './channels'

export const GD20W_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 255,
  channelsStartupTime: false,
  channelsMeasureOffset: false,
  mainConfigBLE: false,
  mainConfigSingleMeasuringRate: false,
} as const satisfies Tulip2EncodeFeatureFlags

export type GD20WTulip2FeatureFlags = typeof GD20W_DOWNLINK_FEATURE_FLAGS
export type GD20WTulip2Channels = ReturnType<typeof createGD20WTULIP2Channels>

export type GD20WTulip2DownlinkInput
  = | TULIP2DownlinkInput<GD20WTulip2Channels[number], typeof GD20W_DOWNLINK_FEATURE_FLAGS>
    | GD20WTULIP2DownlinkExtraInput

export const GD20W_DEFAULT_CONFIGURATION_ID = 1
export const GD20W_DEFAULT_BYTE_LIMIT = 51

export const GD20W_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  GET_MAIN_CONFIG: 0x04,
  GENERAL_DEVICE_COMMAND: 0x05,
  ENABLE_DISABLE_CHANNEL: 0x11,
  SET_PROCESS_ALARM: 0x20,
  GET_PROCESS_ALARM: 0x40,
} as const

export const GD20W_GENERAL_DEVICE_COMMANDS = {
  RESET_BATTERY_INDICATOR: 0x00,
} as const

export { createGD20WTULIP2Channels }
export type { TULIP2Channel }

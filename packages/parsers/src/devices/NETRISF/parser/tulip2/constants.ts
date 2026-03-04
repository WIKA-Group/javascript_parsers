import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type { TULIP2DownlinkInput, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'
import type { NetrisFTULIP2DownlinkExtraInput } from '../../schema/tulip2'
import { createNetrisFTULIP2Channels } from './channels'

export const NETRISF_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 31,
  channelsStartupTime: false,
  channelsMeasureOffset: true,
  mainConfigBLE: true,
  mainConfigSingleMeasuringRate: false,
} as const satisfies Tulip2EncodeFeatureFlags

export type NetrisFTulip2FeatureFlags = typeof NETRISF_DOWNLINK_FEATURE_FLAGS
export type NetrisFTulip2Channels = ReturnType<typeof createNetrisFTULIP2Channels>

export type NetrisFTulip2DownlinkInput
  = | TULIP2DownlinkInput<NetrisFTulip2Channels[number], typeof NETRISF_DOWNLINK_FEATURE_FLAGS>
    | NetrisFTULIP2DownlinkExtraInput

/**
 * NETRISF TULIP2 downlink command bytes.
 * Packet format: [configId, 0x00, cmd, ...options]
 *
 * The 0x00 reserved byte is always present as byte 1, consistent with the PEW protocol.
 */
export const NETRISF_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  GET_MAIN_CONFIG: 0x04,
  SET_STRAIN_ALARM: 0x20,
  SET_TEMPERATURE_ALARM: 0x21,
  SET_STRAIN_PROPERTY: 0x30,
  SET_TEMPERATURE_PROPERTY: 0x31,
  RESET_BATTERY: 0x40,
  GET_STRAIN_ALARM: 0x50,
  GET_TEMPERATURE_ALARM: 0x51,
  GET_STRAIN_PROPERTY: 0x60,
  GET_TEMPERATURE_PROPERTY: 0x61,
} as const

export const NETRISF_DEFAULT_CONFIGURATION_ID = 1
export const NETRISF_DEFAULT_BYTE_LIMIT = 51

// Re-export channels creator for convenience
export { createNetrisFTULIP2Channels }
export type { TULIP2Channel }

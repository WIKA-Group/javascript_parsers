import type { TULIP2Channel } from '../../../../codecs/tulip2'
import type { TULIP2DownlinkInput, Tulip2EncodeFeatureFlags } from '../../../../schemas/tulip2/downlink'
import * as v from 'valibot'
import { createConfigurationIdSchema } from '../../../../schemas/tulip2/downlink'

export const PEWTULIP2_CHANNEL_0 = {
  name: 'pressure' as const,
  channelId: 0 as const,
  defaultRange: {
    start: 0 as number,
    end: 10 as number,
  },
} as const

export const PEWTULIP2_CHANNEL_1 = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  defaultRange: {
    start: -45 as number,
    end: 110 as number,
  },
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2PEWChannels() {
  return [
    {
      channelId: PEWTULIP2_CHANNEL_0.channelId,
      name: PEWTULIP2_CHANNEL_0.name,
      start: PEWTULIP2_CHANNEL_0.defaultRange.start,
      end: PEWTULIP2_CHANNEL_0.defaultRange.end,
    },
    {
      channelId: PEWTULIP2_CHANNEL_1.channelId,
      name: PEWTULIP2_CHANNEL_1.name,
      start: PEWTULIP2_CHANNEL_1.defaultRange.start,
      end: PEWTULIP2_CHANNEL_1.defaultRange.end,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

export const PEW_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 127,
  channelsStartupTime: false,
  channelsMeasureOffset: true,
  mainConfigBLE: true,
  mainConfigSingleMeasuringRate: false,
} as const satisfies Tulip2EncodeFeatureFlags

export type PewTulip2FeatureFlags = typeof PEW_DOWNLINK_FEATURE_FLAGS
export type PewTulip2Channels = ReturnType<typeof createTULIP2PEWChannels>

// ─── PEW-specific action schemas ────────────────────────────────────────────────

// eslint-disable-next-line ts/explicit-function-return-type
export function createDropConfigurationSchema() {
  return v.object({
    deviceAction: v.literal('dropConfiguration'),
    configurationId: createConfigurationIdSchema(PEW_DOWNLINK_FEATURE_FLAGS.maxConfigId),
  })
}

const getConfigurationChannelSchema = v.optional(
  v.union([
    v.literal(true),
    v.object({
      alarms: v.optional(v.literal(true)),
      measureOffset: v.optional(v.literal(true)),
    }),
  ]),
)

// eslint-disable-next-line ts/explicit-function-return-type
export function createGetConfigurationSchema() {
  return v.object({
    deviceAction: v.literal('getConfiguration'),
    mainConfiguration: v.optional(v.literal(true)),
    channel0: getConfigurationChannelSchema,
    channel1: getConfigurationChannelSchema,
  })
}

export type PewTulip2DownlinkInput
  = | TULIP2DownlinkInput<PewTulip2Channels[number], typeof PEW_DOWNLINK_FEATURE_FLAGS>
    | v.InferOutput<ReturnType<typeof createDropConfigurationSchema>>
    | v.InferOutput<ReturnType<typeof createGetConfigurationSchema>>

/**
 * PEW TULIP2 downlink command bytes.
 * These differ from the shared NETRIS2-style encoding:
 * - PEW uses per-channel command IDs (0x20/0x21) instead of a single command with channel index
 * - PEW uses 0x40 for battery reset instead of 0x05
 * - PEW has additional "Get" and "Drop on air" commands
 */
export const PEW_COMMANDS = {
  RESET_FACTORY: 0x01,
  SET_MAIN_CONFIG: 0x02,
  DROP_ON_AIR: 0x03,
  GET_MAIN_CONFIG: 0x04,
  DISABLE_PRESSURE: 0x10,
  DISABLE_TEMPERATURE: 0x11,
  SET_PRESSURE_ALARM: 0x20,
  SET_TEMPERATURE_ALARM: 0x21,
  SET_PRESSURE_PROPERTY: 0x30,
  SET_TEMPERATURE_PROPERTY: 0x31,
  RESET_BATTERY: 0x40,
  GET_PRESSURE_ALARM: 0x50,
  GET_TEMPERATURE_ALARM: 0x51,
  GET_PRESSURE_PROPERTY: 0x60,
  GET_TEMPERATURE_PROPERTY: 0x61,
} as const

export const PEW_DEFAULT_CONFIGURATION_ID = 1
export const PEW_DEFAULT_BYTE_LIMIT = 51

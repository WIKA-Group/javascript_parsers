import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const TGUTULIP2_TEMPERATURE_CHANNEL = {
  name: 'temperature' as const,
  channelId: 0 as const,
  start: 0 as number,
  end: 100 as number,
} as const

export const TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  start: -40 as number,
  end: 60 as number,
  adjustMeasurementRangeDisallowed: true,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2TGUChannels() {
  return [
    {
      channelId: TGUTULIP2_TEMPERATURE_CHANNEL.channelId,
      name: TGUTULIP2_TEMPERATURE_CHANNEL.name,
      start: TGUTULIP2_TEMPERATURE_CHANNEL.start,
      end: TGUTULIP2_TEMPERATURE_CHANNEL.end,
    },
    {
      channelId: TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId,
      name: TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.name,
      start: TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.start,
      end: TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.end,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

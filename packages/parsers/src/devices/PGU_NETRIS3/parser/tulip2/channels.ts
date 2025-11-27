import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const PGUTULIP2_PRESSURE_CHANNEL = {
  name: 'pressure' as const,
  channelId: 0 as const,
  start: 0 as number,
  end: 10 as number,
} as const

export const PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  start: -40 as number,
  end: 60 as number,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2PGUChannels() {
  return [
    {
      channelId: PGUTULIP2_PRESSURE_CHANNEL.channelId,
      name: PGUTULIP2_PRESSURE_CHANNEL.name,
      start: PGUTULIP2_PRESSURE_CHANNEL.start,
      end: PGUTULIP2_PRESSURE_CHANNEL.end,
    },
    {
      channelId: PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId,
      name: PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.name,
      start: PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.start,
      end: PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.end,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

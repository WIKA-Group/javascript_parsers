import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const PEUTULIP2_PRESSURE_CHANNEL = {
  name: 'pressure' as const,
  channelId: 0 as const,
  start: 0 as number,
  end: 10 as number,
} as const

export const PEUTULIP2_DEVICE_TEMPERATURE_CHANNEL = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  start: -40 as number,
  end: 60 as number,
  adjustMeasuringRangeDisallowed: true,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2PEUChannels() {
  return [
    {
      channelId: PEUTULIP2_PRESSURE_CHANNEL.channelId,
      name: PEUTULIP2_PRESSURE_CHANNEL.name,
      start: PEUTULIP2_PRESSURE_CHANNEL.start,
      end: PEUTULIP2_PRESSURE_CHANNEL.end,
    },
    {
      channelId: PEUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId,
      name: PEUTULIP2_DEVICE_TEMPERATURE_CHANNEL.name,
      start: PEUTULIP2_DEVICE_TEMPERATURE_CHANNEL.start,
      end: PEUTULIP2_DEVICE_TEMPERATURE_CHANNEL.end,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

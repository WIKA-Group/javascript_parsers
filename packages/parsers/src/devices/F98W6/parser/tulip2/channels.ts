import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const F98W6_STRAIN_CHANNEL = {
  name: 'strain' as const,
  channelId: 0 as const,
  start: -312.5 as number,
  end: 312.5 as number,
} as const

export const F98W6_DEVICE_TEMPERATURE_CHANNEL = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  start: -45 as number,
  end: 110 as number,
} as const

export const F98W6_BATTERY_VOLTAGE_CHANNEL = {
  name: 'battery voltage' as const,
  channelId: 2 as const,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createF98W6TULIP2Channels() {
  return [
    {
      channelId: F98W6_STRAIN_CHANNEL.channelId,
      name: F98W6_STRAIN_CHANNEL.name,
      start: F98W6_STRAIN_CHANNEL.start,
      end: F98W6_STRAIN_CHANNEL.end,
    },
    {
      channelId: F98W6_DEVICE_TEMPERATURE_CHANNEL.channelId,
      name: F98W6_DEVICE_TEMPERATURE_CHANNEL.name,
      start: F98W6_DEVICE_TEMPERATURE_CHANNEL.start,
      end: F98W6_DEVICE_TEMPERATURE_CHANNEL.end,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: F98W6_BATTERY_VOLTAGE_CHANNEL.channelId,
      name: F98W6_BATTERY_VOLTAGE_CHANNEL.name,
      // never actually used
      start: 0,
      // never actually used
      end: 5,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

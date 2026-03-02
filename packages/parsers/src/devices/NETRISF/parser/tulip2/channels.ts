import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const NETRISF_STRAIN_CHANNEL = {
  name: 'strain' as const,
  channelId: 0 as const,
  start: -312.5 as number,
  end: 312.5 as number,
} as const

export const NETRISF_DEVICE_TEMPERATURE_CHANNEL = {
  name: 'device temperature' as const,
  channelId: 1 as const,
  start: -45 as number,
  end: 110 as number,
} as const

export const NETRISF_BATTERY_VOLTAGE_CHANNEL = {
  name: 'battery voltage' as const,
  channelId: 2 as const,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createNetrisFTULIP2Channels() {
  return [
    {
      channelId: NETRISF_STRAIN_CHANNEL.channelId,
      name: NETRISF_STRAIN_CHANNEL.name,
      start: NETRISF_STRAIN_CHANNEL.start,
      end: NETRISF_STRAIN_CHANNEL.end,
    },
    {
      channelId: NETRISF_DEVICE_TEMPERATURE_CHANNEL.channelId,
      name: NETRISF_DEVICE_TEMPERATURE_CHANNEL.name,
      start: NETRISF_DEVICE_TEMPERATURE_CHANNEL.start,
      end: NETRISF_DEVICE_TEMPERATURE_CHANNEL.end,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: NETRISF_BATTERY_VOLTAGE_CHANNEL.channelId,
      name: NETRISF_BATTERY_VOLTAGE_CHANNEL.name,
      // never actually used
      start: 0,
      // never actually used
      end: 5,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

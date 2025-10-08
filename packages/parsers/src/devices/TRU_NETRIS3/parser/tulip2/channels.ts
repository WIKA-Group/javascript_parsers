import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const TRUTULIP2_TEMPERATURE_CHANNEL = {
  name: 'temperature' as const,
  channelId: 0 as const,
  start: 0 as number,
  end: 600 as number,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2TRUChannels() {
  return [
    {
      channelId: TRUTULIP2_TEMPERATURE_CHANNEL.channelId,
      name: TRUTULIP2_TEMPERATURE_CHANNEL.name,
      start: TRUTULIP2_TEMPERATURE_CHANNEL.start,
      end: TRUTULIP2_TEMPERATURE_CHANNEL.end,
    },
  ] as const satisfies TULIP2Channel[]
}

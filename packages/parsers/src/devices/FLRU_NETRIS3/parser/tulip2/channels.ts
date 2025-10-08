import type { TULIP2Channel } from '../../../../codecs/tulip2'

export const FLRUTULIP2_LEVEL_CHANNEL = {
  name: 'level' as const,
  channelId: 0 as const,
  defaultRange: {
    start: 0 as number,
    end: 1000 as number,
  },
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2FLRUChannels() {
  return [
    {
      channelId: FLRUTULIP2_LEVEL_CHANNEL.channelId,
      name: FLRUTULIP2_LEVEL_CHANNEL.name,
      start: FLRUTULIP2_LEVEL_CHANNEL.defaultRange.start,
      end: FLRUTULIP2_LEVEL_CHANNEL.defaultRange.end,
    },
  ] as const satisfies TULIP2Channel[]
}

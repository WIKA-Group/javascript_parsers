import type { TULIP2Channel } from '../../../../codecs/tulip2'

// eslint-disable-next-line ts/explicit-function-return-type
export function createGD20WTULIP2Channels() {
  return [
    { channelId: 0, name: 'channel0', start: 4, end: 20 },
    { channelId: 1, name: 'channel1', start: 4, end: 20 },
    { channelId: 2, name: 'channel2', start: 4, end: 20 },
    { channelId: 3, name: 'channel3', start: 4, end: 20 },
    { channelId: 4, name: 'channel4', start: 4, end: 20 },
    { channelId: 5, name: 'channel5', start: 4, end: 20 },
  ] as const satisfies TULIP2Channel[]
}

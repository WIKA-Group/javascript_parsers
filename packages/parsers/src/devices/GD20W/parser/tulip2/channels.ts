import type { TULIP2Channel } from '../../../../codecs/tulip2'

// eslint-disable-next-line ts/explicit-function-return-type
export function createGD20WTULIP2Channels() {
  return [
    { channelId: 0, name: 'channel0', start: 0, end: 12 },
    { channelId: 1, name: 'channel1', start: -1.013, end: 10.987 },
    { channelId: 2, name: 'channel2', start: 0, end: 85.7879104614 },
    { channelId: 3, name: 'channel3', start: -1.013, end: 14.7351512909 },
    { channelId: 4, name: 'channel4', start: 0, end: 15.7481508255 },
    { channelId: 5, name: 'channel5', start: -40, end: 80 },
  ] as const satisfies TULIP2Channel[]
}

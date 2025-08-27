import type { Channel } from '../types'
import type { AnyCodec } from './codec'

/**
 * Checks the validity of multiple channels.
 * @param channels The channels to check.
 * @throws Will throw an error if start is equal to or greater than end.
 */
export function checkChannelsValidity(channels: Channel[], codecName?: string): void {
  channels.forEach((channel) => {
    // validate that start is less than end
    if (channel.start >= channel.end) {
      if (codecName) {
        throw new Error(`Invalid channel range in codec ${codecName}: ${channel.start} >= ${channel.end} in channel ${channel.name}`)
      }
      throw new Error(`Invalid channel range: ${channel.start} >= ${channel.end} in channel ${channel.name}`)
    }
  })
}

export function checkCodecsValidity(codecs: AnyCodec[]): void {
  if (codecs.length === 0) {
    throw new Error('At least one codec must be provided')
  }

  // check if the overall ranges in the codecs of all channels are valid
  codecs.forEach((codec) => {
    const channels = codec.getChannels()
    checkChannelsValidity(channels, codec.name)
  })

  // we need to check if the name of each codec is unique AND if the same channels exist on all of the codecs.

  // first check codec names
  codecs.forEach((codec, index) => {
    const otherCodecs = codecs.filter((_, i) => i !== index)
    if (otherCodecs.find(c => c.name === codec.name)) {
      throw new Error(`Codec names must be unique. Duplicate found: ${codec.name}`)
    }
  })

  // then check if all have channels with the same names (order is not important)
  const firstCodecChannelNames = codecs[0]!.getChannels().map(c => c.name)
  // check if all channel names are present in the other codecs and vice versa (only duplicates, no extra channel)

  codecs.forEach((codec, index) => {
    if (index === 0)
      return // skip first codec
    const currentCodecChannelNames = codec.getChannels().map(c => c.name)
    const check = {
      missing: [] as string[],
      extra: [] as string[],
    }

    currentCodecChannelNames.forEach((name) => {
      if (!firstCodecChannelNames.includes(name)) {
        check.extra.push(name)
      }
    })

    firstCodecChannelNames.forEach((name) => {
      if (!currentCodecChannelNames.includes(name)) {
        check.missing.push(name)
      }
    })

    // throw errors
    if (check.extra.length > 0) {
      throw new Error(`Codec ${codec.name} has extra channels not present in other codecs: ${check.extra.join(', ')}`)
    }
    if (check.missing.length > 0) {
      throw new Error(`Codec ${codec.name} is missing channels present in other codecs: ${check.missing.join(', ')}`)
    }
  })

  // now also check if the channels with the same names have the same range (start, end) in all codecs
  const channelRanges = new Map<string, [number, number]>()

  codecs.forEach((codec) => {
    codec.getChannels().forEach((channel) => {
      const range = [channel.start, channel.end] as [number, number]
      if (channelRanges.has(channel.name)) {
        const existingRange = channelRanges.get(channel.name)!
        if (existingRange[0] !== range[0] || existingRange[1] !== range[1]) {
          throw new Error(`Channel ${channel.name} has inconsistent ranges across codecs: ${JSON.stringify(existingRange)} vs ${JSON.stringify(range)}`)
        }
      }
      else {
        channelRanges.set(channel.name, range)
      }
    })
  })
}

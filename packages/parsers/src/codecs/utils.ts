import type { Channel } from '../types'
import type { AnyCodec } from './codec'

/**
 * Checks the validity of multiple channels.
 * @param channels The channels to check.
 * @param codecName Optional codec name for more detailed error messages.
 * @throws Will throw an error if start is equal to or greater than end.
 * @throws Will throw an error if duplicate channel names are found.
 */
export function checkChannelsValidity(channels: Channel[], codecName?: string): void {
  const channelNameSet = new Set<string>()

  channels.forEach((channel) => {
    // validate that start is less than end
    if (channel.start >= channel.end) {
      if (codecName) {
        throw new Error(`Invalid channel range in codec ${codecName}: ${channel.start} >= ${channel.end} in channel ${channel.name}`)
      }
      throw new Error(`Invalid channel range: ${channel.start} >= ${channel.end} in channel ${channel.name}`)
    }

    if (channelNameSet.has(channel.name)) {
      if (codecName) {
        throw new Error(`Duplicate channel name found in codec ${codecName}: ${channel.name}`)
      }
      throw new Error(`Duplicate channel name found: ${channel.name}`)
    }
    channelNameSet.add(channel.name)
  })
}

/**
 * Checks the validity of multiple codecs and ensures they are compatible.
 * Validates that all codecs have unique names, matching channel names, consistent channel ranges,
 * and consistent adjustMeasurementRangeDisallowed settings.
 *
 * @param codecs The array of codecs to validate.
 * @returns A record mapping channel names to their adjustment permission status.
 *          `true` means adjustment is disallowed, `false` means adjustment is allowed.
 * @throws Will throw an error if no codecs are provided.
 * @throws Will throw an error if codec names are not unique.
 * @throws Will throw an error if codecs have different channel names.
 * @throws Will throw an error if channels with the same name have different ranges across codecs.
 * @throws Will throw an error if channels with the same name have inconsistent adjustMeasurementRangeDisallowed settings.
 */
export function checkCodecsValidity(codecs: AnyCodec[]): Record<string, boolean> {
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
  const channelAdjustmentPermissions: Record<string, boolean> = {}

  codecs.forEach((codec) => {
    codec.getChannels().forEach((channel) => {
      const range = [channel.start, channel.end] as [number, number]
      const isDisallowed = channel.adjustMeasurementRangeDisallowed ?? false

      if (channelRanges.has(channel.name)) {
        const existingRange = channelRanges.get(channel.name)!
        if (existingRange[0] !== range[0] || existingRange[1] !== range[1]) {
          throw new Error(`Channel ${channel.name} has inconsistent ranges across codecs: ${JSON.stringify(existingRange)} vs ${JSON.stringify(range)}`)
        }

        const existingDisallowed = channelAdjustmentPermissions[channel.name]!
        if (existingDisallowed !== isDisallowed) {
          throw new Error(`Channel ${channel.name} has inconsistent adjustMeasurementRangeDisallowed settings across codecs: ${existingDisallowed} vs ${isDisallowed}`)
        }
      }
      else {
        channelRanges.set(channel.name, range)
        channelAdjustmentPermissions[channel.name] = isDisallowed
      }
    })
  })

  return channelAdjustmentPermissions
}

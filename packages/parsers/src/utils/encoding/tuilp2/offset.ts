import type { DownlinkCommand } from './frames'
import { pushSignedInt16 } from '../push'

const CHANNEL_PROPERTY_COMMAND = 0x30

interface ChannelOffsetConfig {
  /**
   * Offset in percent of the span.
   * Range: [-5%, 5%]
   * Default: 0
   * @example offset: -0.23
   */
  offset: number
}

export interface ChannelPropertyConfig {
  [key: `channel${number}`]: ChannelOffsetConfig
}

/**
 * Builds the downlink commands for channel property (offset) configuration.
 * @param config The channel property configuration.
 * @returns The downlink commands for channel property configuration.
 */
export function buildMeasureOffsetCommands(
  config: ChannelPropertyConfig | undefined,
  _payloadLimit: number,
): DownlinkCommand[] {
  if (!config) {
    return []
  }

  let channelMask = 0
  const offsetsByChannel: Map<number, number> = new Map()

  Object.keys(config).forEach((key) => {
    const numberString = key.replace('channel', '')
    const channelIndex = Number.parseInt(numberString, 10)
    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }

    const channelConfig = config[key as keyof typeof config]
    if (channelConfig?.offset !== undefined) {
      channelMask |= 1 << channelIndex
      offsetsByChannel.set(channelIndex, channelConfig.offset)
    }
  })

  if (channelMask === 0) {
    return []
  }

  const bytes: number[] = [CHANNEL_PROPERTY_COMMAND, channelMask]

  // Add offsets in channel order
  const sortedChannels = Array.from(offsetsByChannel.keys()).sort((a, b) => a - b)
  sortedChannels.forEach((channelIndex) => {
    const offset = offsetsByChannel.get(channelIndex)!
    // Convert offset from percent to signed int16 (scaled by 100 as value is in 0.01% steps)
    pushSignedInt16(bytes, offset)
  })

  // * Yes we could technically split this here into possibly multiple commands, though in reality we dont lose much.
  // * We have to add 2 bytes per message for the id and the mask and would only add unnecessary bytes here.
  // there are scenarios where we could theoretically pack this message into free spaces and save a 3rd downlink this way.
  // we would need to get the size of all free spots in the existing downlinks and see if we can fit it there.
  // might be something for future optimization.

  return [bytes]
}

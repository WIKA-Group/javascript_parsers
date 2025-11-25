import type { DownlinkCommand } from './frames'

const DISABLE_CHANNEL_COMMAND = 0x11

/**
 * Configuration for disabling channels.
 * @property channel{n} - When set to `true`, the channel will be **disabled**. When set to `false`, the channel stays **enabled**.
 */
export interface DisableChannelConfig {
  [key: `channel${number}`]: boolean
}

/**
 * Builds the downlink commands for disabling channels.
 * @param input - The disable channel configuration where `true` disables a channel and `false` keeps it enabled
 * @param byteLimit - The byte limit for the command
 * @returns Array of downlink commands for disabling channels
 */
export function buildDisableChannelCommands(input: DisableChannelConfig | undefined, byteLimit: number): DownlinkCommand[] {
  if (!input) {
    return []
  }

  const bytes: number[] = [DISABLE_CHANNEL_COMMAND]

  // now we get take all the disabled channels and set the bits of a single byte
  let disabledChannelsMask = 0

  Object.keys(input).forEach((key) => {
    const numberString = key.replace('channel', '')
    const channelIndex = Number.parseInt(numberString, 10)

    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }

    if (channelIndex < 0 || channelIndex > 7) {
      throw new Error(`Invalid channel number ${channelIndex} in disableChannel configuration. Must be between 0 and 7.`)
    }

    const shouldDisable = input[key as keyof DisableChannelConfig]
    if (shouldDisable === true) {
      disabledChannelsMask |= (1 << channelIndex)
    }
  })

  bytes.push(disabledChannelsMask)

  if (bytes.length > byteLimit) {
    throw new Error(`Disable channel command exceeds byte limit of ${byteLimit} bytes.`)
  }
  return [bytes]
}

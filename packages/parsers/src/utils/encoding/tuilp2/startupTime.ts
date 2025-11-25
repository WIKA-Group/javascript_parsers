import type { DownlinkCommand } from './frames'
import { pushUint16 } from '../push'

const STARTUP_TIME_COMMAND = 0x60

interface ChannelStartUpTimeConfig {
  /**
   * Start-up time in seconds.
   * Range: [0.1, 15] seconds (100 ms to 15 seconds in 100 ms steps)
   * @example startUpTime: 4 (4 seconds)
   */
  startUpTime: number
}

export interface StartUpTimeConfig {
  [key: `channel${number}`]: ChannelStartUpTimeConfig
}

/**
 * Builds the downlink commands for channel start-up time configuration.
 * @param config The start-up time configuration.
 * @returns The downlink commands for channel start-up time configuration.
 */
export function buildStartupTimeCommands(
  config: StartUpTimeConfig | undefined,
  _payloadLimit: number,
): DownlinkCommand[] {
  if (!config) {
    return []
  }

  let channelMask = 0
  const startUpTimesByChannel: Map<number, number> = new Map()

  Object.keys(config).forEach((key) => {
    const numberString = key.replace('channel', '')
    const channelIndex = Number.parseInt(numberString, 10)
    if (Number.isNaN(channelIndex)) {
      throw new TypeError(`Invalid channel index in key: ${key}`)
    }

    const channelConfig = config[key as keyof typeof config]
    if (channelConfig?.startUpTime !== undefined) {
      // Validate startup time is within bounds: 0.1s to 15s (100ms to 15000ms)
      if (channelConfig.startUpTime < 0.1 || channelConfig.startUpTime > 15) {
        throw new RangeError(
          `Start-up time for ${key} must be between 0.1s and 15s, got ${channelConfig.startUpTime}s`,
        )
      }
      channelMask |= 1 << channelIndex
      startUpTimesByChannel.set(channelIndex, channelConfig.startUpTime)
    }
  })

  if (channelMask === 0) {
    return []
  }

  const bytes: number[] = [STARTUP_TIME_COMMAND, channelMask]

  // Add start-up times in channel order
  const sortedChannels = Array.from(startUpTimesByChannel.keys()).sort((a, b) => a - b)
  sortedChannels.forEach((channelIndex) => {
    const startUpTime = startUpTimesByChannel.get(channelIndex)!
    // Convert time from seconds to units of 100ms (0.1s)
    // 4 seconds -> 40 (0.1s units)
    pushUint16(bytes, Math.round(startUpTime * 10))
  })

  // Same as in offset.ts
  // * Yes we could technically split this here into possibly multiple commands, though in reality we dont lose much.
  // * We have to add 2 bytes per message for the id and the mask and would only add unnecessary bytes here.
  // there are scenarios where we could theoretically pack this message into free spaces and save a 3rd downlink this way.
  // we would need to get the size of all free spots in the existing downlinks and see if we can fit it there.
  // might be something for future optimization.

  return [bytes]
}

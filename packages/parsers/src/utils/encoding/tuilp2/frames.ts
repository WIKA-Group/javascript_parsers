import { ffd } from '../ffd'

/**
 * Downlink command for configuration.
 * Does only the actual command bytes, without configuration ID.
 */
export type DownlinkCommand = number[]

/**
 * The complete downlink frame including configuration ID and one or more commands (concatenated).
 */
export type DownlinkFrame = number[]

export interface BuildDownlinkFramesOptions {
  configId: number
  maxConfigId: number

  /**
   * The actual byte limit for the downlink frame including configuration ID.
   */
  byteLimit: number
}

export function buildDownlinkFrame(commands: DownlinkCommand[], options: BuildDownlinkFramesOptions): DownlinkFrame {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided to build the downlink frame.')
  }

  const bytes: number[] = [options.configId]

  for (const command of commands) {
    bytes.push(...command)
  }

  if (bytes.length === 0) {
    throw new Error('No bytes were generated for the downlink frame.')
  }

  // check if we exceed the byte limit
  if (bytes.length > options.byteLimit) {
    throw new Error(
      `Downlink frame exceeds byte limit of ${options.byteLimit} bytes (got ${bytes.length} bytes).`,
    )
  }

  return bytes
}

export function buildDownlinkFrames(commands: DownlinkCommand[], options: BuildDownlinkFramesOptions): DownlinkFrame[] {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided for encoding.')
  }

  const payloadLimit = options.byteLimit - 1

  // Use FFD algorithm to pack commands into bins with payload limit
  const packets = ffd(commands, payloadLimit)

  // Assign incrementing config IDs with rollover at maxConfigId
  const frames: DownlinkFrame[] = []
  let currentConfigId = options.configId

  for (const packet of packets) {
    frames.push([currentConfigId, ...packet])
    currentConfigId++
    if (currentConfigId > options.maxConfigId) {
      currentConfigId = options.configId
    }
  }

  return frames
}

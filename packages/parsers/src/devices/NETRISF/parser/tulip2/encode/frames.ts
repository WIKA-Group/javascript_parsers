import type { DownlinkCommand } from './commands'
import { ffd } from '../../../../../utils/encoding/ffd'

export type DownlinkFrame = number[]

export interface BuildNetrisFDownlinkFramesOptions {
  configId: number
  maxConfigId: number
  byteLimit: number
}

/**
 * Build a single NETRISF downlink frame.
 *
 * NETRISF frame format:
 * - Byte 0: Configuration transaction ID (configId)
 * - Byte 1: Reserved / Downlink Index — always 0x00 for a single frame
 * - Byte 2+: Payload (concatenated commands)
 */
export function buildNetrisFDownlinkFrame(commands: DownlinkCommand[], options: BuildNetrisFDownlinkFramesOptions): DownlinkFrame {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided to build the downlink frame.')
  }

  const bytes: number[] = [options.configId, 0x00]

  for (const command of commands) {
    bytes.push(...command)
  }

  if (bytes.length > options.byteLimit) {
    throw new Error(
      `Downlink frame exceeds byte limit of ${options.byteLimit} bytes (got ${bytes.length} bytes).`,
    )
  }

  return bytes
}

/**
 * Build multiple NETRISF downlink frames using FFD bin packing.
 *
 * Frame format per packet:
 * - Byte 0: Configuration transaction ID (same for all frames)
 * - Byte 1: (Downlink Index << 4) | Max Index
 * - Byte 2+: Payload
 */
export function buildNetrisFDownlinkFrames(commands: DownlinkCommand[], options: BuildNetrisFDownlinkFramesOptions): DownlinkFrame[] {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided for encoding.')
  }

  // 2 bytes reserved for configId + packet index byte
  const payloadLimit = options.byteLimit - 2

  const packets = ffd(commands, payloadLimit)

  const maxIndex = packets.length - 1

  const frames: DownlinkFrame[] = []

  for (let index = 0; index < packets.length; index++) {
    const packetIndexByte = (index << 4) | maxIndex
    frames.push([options.configId, packetIndexByte, ...packets[index]!])
  }

  return frames
}

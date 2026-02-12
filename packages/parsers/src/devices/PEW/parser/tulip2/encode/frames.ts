import type { DownlinkCommand } from './commands'
import { ffd } from '../../../../../utils/encoding/ffd'

export type DownlinkFrame = number[]

export interface BuildPEWDownlinkFramesOptions {
  configId: number
  maxConfigId: number
  byteLimit: number
}

/**
 * Build a single PEW downlink frame.
 *
 * PEW frame format:
 * - Byte 0: Configuration transaction ID
 * - Byte 1: (Downlink Index << 4) | Max Index
 *   For a single frame: index=0, maxIndex=0, so byte 1 = 0x00
 * - Byte 2+: Payload (concatenated commands)
 */
export function buildPEWDownlinkFrame(commands: DownlinkCommand[], options: BuildPEWDownlinkFramesOptions): DownlinkFrame {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided to build the downlink frame.')
  }

  // configId, packet index byte, then all commands
  const bytes: number[] = [options.configId, 0x00]

  for (const command of commands) {
    bytes.push(...command)
  }

  if (bytes.length === 0) {
    throw new Error('No bytes were generated for the downlink frame.')
  }

  if (bytes.length > options.byteLimit) {
    throw new Error(
      `Downlink frame exceeds byte limit of ${options.byteLimit} bytes (got ${bytes.length} bytes).`,
    )
  }

  return bytes
}

/**
 * Build multiple PEW downlink frames using FFD bin packing.
 *
 * PEW frame format per packet:
 * - Byte 0: Configuration transaction ID (same for all frames in a transaction)
 * - Byte 1: (Downlink Index << 4) | Max Index
 * - Byte 2+: Payload
 *
 * Unlike NETRIS2 which increments configId per frame, PEW uses a packet index byte
 * to distinguish frames within the same transaction.
 */
export function buildPEWDownlinkFrames(commands: DownlinkCommand[], options: BuildPEWDownlinkFramesOptions): DownlinkFrame[] {
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

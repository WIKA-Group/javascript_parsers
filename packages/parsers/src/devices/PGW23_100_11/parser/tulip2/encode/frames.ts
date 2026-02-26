import type { DownlinkCommand } from './commands'
import { ffd } from '../../../../../utils/encoding/ffd'

export type DownlinkFrame = number[]

export interface BuildPGWDownlinkFramesOptions {
  configId: number
  maxConfigId: number
  byteLimit: number
}

export function buildPGWDownlinkFrame(commands: DownlinkCommand[], options: BuildPGWDownlinkFramesOptions): DownlinkFrame {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided to build the downlink frame.')
  }

  const bytes: number[] = [options.configId, 0x00]

  for (const command of commands) {
    bytes.push(...command)
  }

  if (bytes.length > options.byteLimit) {
    throw new Error(`Downlink frame exceeds byte limit of ${options.byteLimit} bytes (got ${bytes.length} bytes).`)
  }

  return bytes
}

export function buildPGWDownlinkFrames(commands: DownlinkCommand[], options: BuildPGWDownlinkFramesOptions): DownlinkFrame[] {
  if (commands.length === 0) {
    throw new Error('No Downlink commands were provided for encoding.')
  }

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

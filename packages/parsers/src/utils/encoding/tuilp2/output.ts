import type { DownlinkOutput, MultipleDownlinkOutput } from '../../../types'
import type { DownlinkFrame } from './frames'

export function formatDownlinkOutput(downlinkFrame: DownlinkFrame): DownlinkOutput {
  return {
    bytes: downlinkFrame,
    fPort: 1, // TULIP2 downlinks always use fPort 1
  }
}

export function formatMultipleDownlinkOutput(downlinkFrames: DownlinkFrame[]): MultipleDownlinkOutput {
  return {
    frames: downlinkFrames,
    fPort: 1, // TULIP2 downlinks always use fPort 1
  }
}

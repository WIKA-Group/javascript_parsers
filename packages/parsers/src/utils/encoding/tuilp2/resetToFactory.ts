import type { DownlinkCommand } from './frames'

export function buildResetToFactoryCommand(): DownlinkCommand {
  return [0x01]
}

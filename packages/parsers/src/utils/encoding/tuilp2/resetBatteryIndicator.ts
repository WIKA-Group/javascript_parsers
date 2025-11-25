import type { DownlinkCommand } from './frames'

export function buildResetBatteryIndicatorCommand(): DownlinkCommand {
  return [0x05]
}

// Configuration status (0x06) high-nibble mapping (align with PEW/NETRISF)
export const CONFIGURATION_BASE_STATUS_TYPES = {
  2: 'configuration applied',
  3: 'configuration rejected',
  6: 'command success',
  7: 'command failed',
} as const

export const CONFIGURATION_STATUS_DISCARDED_FORCE = {
  5: 'configuration discarded',
} as const

export const CONFIGURATION_STATUS_DISCARDED_ALL_PACKAGES = {
  4: 'configuration discarded - Never received all packets',
} as const

export const CONFIGURATION_STATUS_PACKET_RECEIVED = {
  0: 'packet received',
} as const

export const CONFIGURATION_STATUS_NO_PACKET_RECEIVED = {
  1: 'no packet received',
} as const

export const CONFIG_STATUS_COMMAND_TYPES = {
  'get main configuration': 0x04,
  'reset battery indicator': 0x40,
  'get process alarm configuration pressure': 0x50,
  'get process alarm configuration temperature': 0x51,
  'get channel property configuration pressure': 0x60,
  'get channel property configuration temperature': 0x61,
} as const

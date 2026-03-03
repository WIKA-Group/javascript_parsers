export const MESSAGE_TYPES = {
  1: 'DATA_MESSAGE_1',
  2: 'DATA_MESSAGE_2',
  3: 'PROCESS_ALARM',
  4: 'TECHNICAL_ALARM',
  5: 'DEVICE_ALARM',
  6: 'CONFIGURATION_STATUS',
  7: 'DEVICE_IDENTIFICATION',
  8: 'KEEP_ALIVE',
  9: 'EXTENDED_DEVICE_IDENTIFICATION',
} as const

export const ALARM_EVENTS = {
  triggered: 0,
  disappeared: 1,
} as const

export const PROCESS_ALARM_TYPES = {
  'low threshold': 1,
  'high threshold': 2,
  'falling slope': 4,
  'rising slope': 8,
  'low threshold with delay': 16,
  'high threshold with delay': 32,
} as const

export const PROCESS_ALARM_CHANNEL_NAMES_BY_ID = {
  0: 'strain',
  1: 'device temperature',
} as const

export const DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE = {
  0: 'generic',
  1: 'device dependent',
} as const

export const DEVICE_ALARM_TYPES = {
  'low battery alarm': 0,
  'duty cycle alarm': 4,
} as const

export const TECHNICAL_ALARM_TYPES = {
  'Punctual sensor error': 1,
  'Permanent sensor error': 4,
  'strain value out of limit': 32,
  'temperature value out of limit': 64,
} as const

export const PRODUCT_SUB_ID_NAMES = {
  LoRaWAN: 0,
  MIOTY: 1,
} as const

export const STRAIN_TYPES_BY_ID = {
  1: 'absolute',
  2: 'gauge / relative',
} as const

export const PHYSICAL_UNIT_NAMES_STRAIN = {
  45: 'N',
  47: 'kN',
  55: 'kg',
  56: 'g',
  185: 'µeps',
} as const

export const PHYSICAL_UNIT_NAMES_TEMPERATURE = {
  32: '°C',
  33: '°F',
} as const

export const CONFIG_STATUS_NAMES_BY_VALUE = {
  2: 'configuration applied',
  3: 'configuration rejected',
  5: 'configuration discarded',
  6: 'command success',
  7: 'command failed',
} as const

export const CONFIG_STATUS_COMMAND_TYPES = {
  'get main configuration': 0x04,
  'reset battery indicator': 0x40,
  'get process alarm configuration strain': 0x50,
  'get process alarm configuration temperature': 0x51,
  'get channel property configuration strain': 0x60,
  'get channel property configuration temperature': 0x61,
} as const

export const PHYSICAL_UNIT_NAMES_BY_ID = {
  ...PHYSICAL_UNIT_NAMES_STRAIN,
  ...PHYSICAL_UNIT_NAMES_TEMPERATURE,
} as const

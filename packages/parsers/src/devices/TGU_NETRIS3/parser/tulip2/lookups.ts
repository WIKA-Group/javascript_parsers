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

export const PROCESS_ALARM_TYPES = {
  'low threshold': 0,
  'high threshold': 1,
  'falling slope': 2,
  'rising slope': 3,
  'low threshold with delay': 4,
  'high threshold with delay': 5,
} as const

export const TECHNICAL_ALARM_TYPES = {
  'MV_STAT channel 0': 0,
  'MV_STAT channel 1': 1,
  'MV_STAT channel 2': 2,
  'MV_STAT channel 3': 3,
  'STAT_DEV': 4,
} as const

const MV_STAT_CAUSE_OF_FAILURE_ENTRIES = [
  { mask: 0x1, name: 'MV_STAT_ERROR' },
  { mask: 0x2, name: 'MV_STAT_WARNING' },
] as const

const STAT_DEV_CAUSE_OF_FAILURE_ENTRIES = [
  { mask: 0x1, name: 'STAT_DEV_ERROR' },
  { mask: 0x2, name: 'STAT_DEV_WARNING' },
  { mask: 0x4, name: 'STAT_DEV_RESTARTED' },
] as const

export const TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE = {
  [TECHNICAL_ALARM_TYPES['MV_STAT channel 0']]: MV_STAT_CAUSE_OF_FAILURE_ENTRIES,
  [TECHNICAL_ALARM_TYPES['MV_STAT channel 1']]: MV_STAT_CAUSE_OF_FAILURE_ENTRIES,
  [TECHNICAL_ALARM_TYPES['MV_STAT channel 2']]: MV_STAT_CAUSE_OF_FAILURE_ENTRIES,
  [TECHNICAL_ALARM_TYPES['MV_STAT channel 3']]: MV_STAT_CAUSE_OF_FAILURE_ENTRIES,
  [TECHNICAL_ALARM_TYPES.STAT_DEV]: STAT_DEV_CAUSE_OF_FAILURE_ENTRIES,
} as const

export const TECHNICAL_CAUSE_OF_FAILURE_NAMES = [
  'STAT_DEV_ERROR',
  'STAT_DEV_WARNING',
  'STAT_DEV_RESTARTED',
  'MV_STAT_ERROR',
  'MV_STAT_WARNING',
] as const

export const DEVICE_ALARM_STATUS_TYPES = {
  'low battery': 1,
  'temperature alarm': 2,
  'duty cycle alarm': 4,
  'UART alarm': 256,
} as const

export const ALARM_EVENTS = {
  triggered: 0,
  disappeared: 1,
} as const

export const PRODUCT_SUB_ID_NAMES = {
  LoRaWAN: 0,
} as const

// Temperature measurand (both channel 0 and channel 1)
export const LPP_MEASURANDS_TEMPERATURE = {
  0x01: 'Temperature',
} as const satisfies Record<number, string>

// Temperature units (both channel 0 and channel 1)
export const LPP_UNITS_TEMPERATURE = {
  0x01: '°C',
  0x02: '°F',
  0x03: 'K',
  0x04: '°R',
} as const satisfies Record<number, string>

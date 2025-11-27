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

export const PRODUCT_SUB_ID_NAMES = {
  LoRaWAN: 0,
  MIOTY: 1,
} as const

// Pressure channel measurands (channel 0)
export const LPP_MEASURANDS_PRESSURE = {
  0x03: 'Pressure (gauge)',
  0x04: 'Pressure (absolute)',
  0x05: 'Pressure (differential)',
} as const satisfies Record<number, string>

// Temperature channel measurands (channel 1)
export const LPP_MEASURANDS_TEMPERATURE = {
  0x01: 'Temperature',
} as const satisfies Record<number, string>

// Combined measurands lookup
export const LPP_MEASURANDS_BY_ID = {
  ...LPP_MEASURANDS_TEMPERATURE,
  ...LPP_MEASURANDS_PRESSURE,
} as const satisfies Record<number, string>

// Pressure channel units (channel 0)
export const LPP_UNITS_PRESSURE = {
  0x07: 'bar',
  0x08: 'mbar',
  0x09: 'µbar',
  0x0A: 'Pa',
  0x0B: 'hPa',
  0x0C: 'kPa',
  0x0D: 'MPa',
  0x0E: 'psi',
  0x0F: 'lbf/ft²',
  0x10: 'kN/m²',
  0x11: 'N/cm²',
  0x12: 'atm',
  0x13: 'kg/cm²',
  0x14: 'kg/mm²',
  0x15: 'µmHg',
  0x16: 'mmHg',
  0x17: 'cmHg',
  0x18: 'inHg',
  0x19: 'mmH2O',
  0x20: 'mH2O',
  0x21: 'inH2O',
  0x22: 'ftH2O',
} as const satisfies Record<number, string>

// Temperature channel units (channel 1)
export const LPP_UNITS_TEMPERATURE = {
  0x01: '°C',
  0x02: '°F',
  0x03: 'K',
  0x04: '°R',
} as const satisfies Record<number, string>

// Combined units lookup
export const LPP_UNITS_BY_ID = {
  ...LPP_UNITS_TEMPERATURE,
  ...LPP_UNITS_PRESSURE,
} as const satisfies Record<number, string>

// NETRIS1-specific lookups derived from legacy index.js
// Use name -> numeric code mappings to mirror PEW style and enable literal unions.

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
  // bitmask mapping
  'SSM communication error': 1,
  'SSM identity error': 128,
} as const

export const DEVICE_ALARM_TYPES = {
  // bitmask mapping
  'low battery error': 1,
  'duty cycle alarm': 4,
  'configuration error': 8,
} as const

export const MEASUREMENT_ALARM_TYPES = {
  // bitmask mapping
  MV_STAT_ERROR: 1,
  MV_STAT_WARNING: 2,
  MV_STAT_LIM_HI: 4,
  MV_STAT_LIM_LO: 8,
  MV_STAT_WARNING_2: 16,
} as const

// Product ID lookups (byte 2)
export const PRODUCT_IDS_BY_ID = {
  0x0F: 'NETRIS1',
  0x10: 'NETRIS©1 BLE+LPWAN',
  0x11: 'NETRIS©1 BLE',
} as const

// Sensor ID lookups (bits 4-0 of byte 3)
export const SENSOR_IDS_BY_ID = {
  0: 'RTD',
  1: 'E-Signal',
  2: 'TRW',
} as const

// LPWAN ID lookups (bits 7-5 of byte 3)
export const LPWAN_IDS_BY_ID = {
  0: 'Reserved',
  1: 'mioty',
  2: 'LoRaWAN',
} as const

// LPP Measurand lookups (id -> human-readable name)
export const LPP_MEASURANDS_BY_ID = {
  1: 'Temperature',
  13: 'Current',
  14: 'Voltage',
  18: 'Relative',
} as const

// LPP Unit lookups (id -> human-readable name)
export const LPP_UNITS_BY_ID = {
  1: '°C',
  2: '°F',
  88: 'V',
  90: 'mA',
  100: '%',
} as const

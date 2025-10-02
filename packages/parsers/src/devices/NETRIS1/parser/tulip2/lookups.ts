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

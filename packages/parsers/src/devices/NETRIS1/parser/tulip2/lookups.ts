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
  2: 'Temperature difference',
  3: 'Pressure (gauge)',
  4: 'Pressure (absolute)',
  5: 'Pressure (differential)',
  6: 'Flow (vol.)',
  7: 'Flow (mass)',
  8: 'Force',
  9: 'Mass',
  10: 'Level',
  11: 'Length',
  12: 'Volume',
  13: 'Current',
  14: 'Voltage',
  15: 'Resistance',
  16: 'Capacitance',
  17: 'Inductance',
  18: 'Relative',
  19: 'Time',
  20: 'Frequency',
  21: 'Speed',
  22: 'Acceleration',
  23: 'Density',
  24: 'Density (gauge pressure at 20 °C)',
  25: 'Density (absolute pressure at 20 °C)',
  26: 'Humidity (relative)',
  27: 'Humidity (absolute)',
  28: 'Angle of rotation / inclination',
  60: 'Device specific',
  61: 'Device specific',
  62: 'Device specific',
} as const

// LPP Unit lookups (id -> human-readable name)
// Note: Some units share the same symbol (e.g., id 1 and 32 are both '°C').
export const LPP_UNITS_BY_ID = {
  1: '°C',
  2: '°F',
  3: 'K',
  4: '°R',
  7: 'bar',
  8: 'mbar',
  9: 'µbar',
  10: 'Pa',
  11: 'hPa',
  12: 'kPa',
  13: 'MPa',
  14: 'psi',
  15: 'lbf/ft²',
  16: 'kN/m²',
  17: 'lbf/in²',
  18: 'N/m²',
  19: 'kPa at 20 °C',
  20: 'MPa at 20 °C',
  21: 'bar at 20 °C',
  22: 'mbar at 20 °C',
  23: 'psi at 20 °C',
  24: 'kg/m³',
  25: 'g/cm³',
  32: '°C',
  88: 'V',
} as const

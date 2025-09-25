// TRW TULIP2 Lookups - extracted from original TRW JavaScript implementation

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

// Bitmask NETRIS®1
// [0] = SSM Communication error
// [7] = SSM Identity error
// all other are reserved
export const TECHNICAL_ALARM_TYPES = {
  'SSM communication error': 1,
  'SSM identity error': 128,
} as const

// Bitmask NETRIS®1:
// 15-8  Device specific alarms unused
// 7-4   Unused
// 3     CONFIGURATION ERROR
// 2     Duty cycle alarm
// 1     Unused
// 0     LOW BATTERY
export const DEVICE_ALARM_TYPES = {
  'low battery error': 1,
  'duty cycle alarm': 4,
  'configuration error': 8,
} as const

// Bitmask:
// 15-5  Reserved for future usage
// 4     MV_STAT_WARNING_2
// 3     MV_STAT_LIM_LO
// 2     MV_STAT_LIM_HI
// 1     MV_STAT_WARNING
// 0     MV_STAT_ERROR
export const MEASUREMENT_ALARM_TYPES = {
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

// LPP Units - reusing from NETRIS1 structure
export const LPP_UNITS_BY_ID = {
  1: '°C',
  2: '°F',
  3: 'K',
  4: 'lux',
  5: 'm/s',
  6: 'm/s²',
  7: 'lat',
  8: 'lon',
  9: 'alt',
  10: 'V',
  11: 'A',
  12: 'W',
  13: 'Hz',
  14: '%',
  15: 'ppm',
  16: 'dBm',
  17: 'cm',
  18: 'in',
  19: 'ft',
  20: 'm',
  21: 'km',
  22: 'mi',
  23: 'kg',
  24: 'lb',
  25: 'oz',
  26: 'g',
  27: 'ton',
  28: 'hPa',
  29: 'mbar',
  30: 'bar',
  31: 'atm',
  32: 'Pa',
  33: 'psi',
  34: 'inHg',
  35: 'mmHg',
  36: 'Torr',
  37: 'l',
  38: 'gal',
  39: 'fl oz',
  40: 'ml',
  41: 'l/s',
  42: 'm³/h',
  43: 'gal/min',
  44: 'gal/h',
  45: 'ft³/min',
  46: 'm³/s',
  47: 'ft³/s',
  48: 'l/min',
  49: 'l/h',
  50: 'pH',
  51: 'ORP',
  52: 'TDS',
  53: 'EC',
  54: 'S/m',
  55: 'mg/l',
  56: 'ppm',
  57: 'ppb',
  58: 'cps',
  59: 'P',
  60: 'St',
  61: 'mPa·s',
  62: 'rpm',
  63: 'rad/s',
  64: 'deg',
  65: 'rad',
  66: 'Ω',
  67: 'Ω·m',
  68: 'Ω/m',
  69: 'S',
  70: 'S/m',
  71: 'Wb',
  72: 'T',
  73: 'Gs',
  74: 'H',
  75: 'F',
  76: 'J',
  77: 'N·m',
  78: 'ft·lb',
  79: 'N',
  80: 'kgf',
  81: 'lbf',
  82: 'dyn',
  83: 'J/s',
  84: 'kW',
  85: 'hp',
  86: 'BTU/h',
  87: 'cal/s',
  88: 'V',
} as const

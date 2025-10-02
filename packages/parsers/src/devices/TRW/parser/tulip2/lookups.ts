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
  13: 'Current',
  14: 'Voltage',
  18: 'Relative',
} as const

// LPP Units - reusing from NETRIS1 structure
export const LPP_UNITS_BY_ID = {
  1: '°C',
  2: '°F',
  88: 'V',
  90: 'mA',
  100: '%',
} as const

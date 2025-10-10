// Derived PGW23.100.11 lookup tables based on the legacy JavaScript codec.
// These const objects are consumed by the TULIP2 codec implementation and
// the accompanying valibot schemas.

export const MESSAGE_TYPES = {
  1: 'DATA_MESSAGE_1',
  2: 'DATA_MESSAGE_2',
  3: 'PROCESS_ALARM',
  4: 'TECHNICAL_ALARM',
  5: 'DEVICE_ALARM',
  7: 'DEVICE_IDENTIFICATION',
  8: 'KEEP_ALIVE',
} as const

export const MEASUREMENT_CHANNELS = {
  'pressure': 0,
  'device temperature': 1,
  'battery voltage': 2,
} as const

export const PROCESS_ALARM_CHANNEL_NAMES = {
  'pressure': 0,
  'device temperature': 1,
} as const

export const PROCESS_ALARM_TYPES = {
  'low threshold': 0,
  'high threshold': 1,
  'falling slope': 2,
  'rising slope': 3,
  'low threshold with delay': 4,
  'high threshold with delay': 5,
} as const

export const ALARM_EVENTS = {
  triggered: 0,
  disappeared: 1,
} as const

export const TECHNICAL_ALARM_CAUSE_OF_FAILURE = {
  '': 0,
  'general failure': 1,
} as const

export const DEVICE_ALARM_CAUSE_OF_FAILURE = {
  '': 0,
  'device dependent': 1,
} as const

export const DEVICE_ALARM_TYPES = {
  'low temperature alarm': 0,
} as const

export const PRESSURE_TYPES = {
  absolute: 1,
  relative: 2,
  differential: 3,
} as const

export const PRESSURE_UNITS = {
  'inH2O': 1,
  'inHg': 2,
  'ftH2O': 3,
  'mmH2O': 4,
  'mmHg': 5,
  'psi': 6,
  'bar': 7,
  'mbar': 8,
  'g/cm²': 9,
  'kg/cm²': 10,
  'Pa': 11,
  'kPa': 12,
  'Torr': 13,
  'at': 14,
  'inH2O (60 °F)': 145,
  'cmH2O (4 °C)': 170,
  'mH2O (4 °C)': 171,
  'cmHg': 172,
  'lb/ft²': 173,
  'hPa': 174,
  'psia': 175,
  'kg/m²': 176,
  'ftH2O (4 °C)': 177,
  'ftH2O (60 °F)': 178,
  'mHg': 179,
  'Mpsi': 180,
  'MPa': 237,
  'inH2O (4 °C)': 238,
  'mmH2O (4 °C)': 239,
} as const

export const TEMPERATURE_UNITS = {
  '°C': 32,
  '°F': 33,
} as const

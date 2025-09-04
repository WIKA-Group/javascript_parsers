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

export const TECHNICAL_ALARM_TYPES = {
  'ALU saturation error': 1,
  'sensor memory integrity error': 2,
  'sensor busy error': 4,
  'reserved': 8,
  'sensor communication error': 16,
  'pressure out of limit': 32,
  'temperature out of limit': 64,
} as const

export const DEVICE_ALARM_TYPES = {
  'battery low': 0,
  'acknowledged message not emitted': 4,
} as const

export const ALARM_EVENTS = {
  triggered: 0,
  disappeared: 1,
} as const

export const DEVICE_ALARM_CAUSE_OF_FAILURE = {
  'generic': 0,
  'device dependent': 1,
} as const

export const PRODUCT_SUB_ID_NAMES = {
  LoRaWAN: 0,
  MIOTY: 1,
} as const

export const PRESSURE_TYPES = {
  'absolute': 1,
  'gauge / relative': 2,
} as const

export const PRESSURE_UNITS = {
  bar: 7,
  MPa: 237,
  psi: 6,
} as const

export const TEMPERATURE_UNITS = {
  '°C': 32,
} as const

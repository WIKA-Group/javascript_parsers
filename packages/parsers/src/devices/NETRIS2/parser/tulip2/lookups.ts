export const PROCESS_ALARM_TYPES = {
  'low threshold': 0,
  'high threshold': 1,
  'falling slope': 2,
  'rising slope': 3,
  'low threshold with delay': 4,
  'high threshold with delay': 5,
} as const

export const TECHNICAL_CAUSE_OF_FAILURE_TYPES = {
  'no alarm': 0,
  'open condition': 1,
  'short condition': 2,
  'saturated low': 3,
  'saturated high': 4,
  'ADC communication error': 5,
} as const

export const TECHNICAL_CAUSE_OF_FAILURE_NAMES = [
  'no alarm',
  'open condition',
  'short condition',
  'saturated low',
  'saturated high',
  'ADC communication error',
] as const

export const ALARM_EVENTS = {
  triggered: 0,
  disappeared: 1,
} as const

export const CONFIGURATION_STATUS_TYPES = {
  0x20: 'configuration successful',
  0x30: 'configuration rejected',
  0x60: 'command successful',
  0x70: 'command failed',
} as const

export const NETRIS2_PRODUCT_ID = 0x0E

export const NETRIS2_PRODUCT_SUB_ID = 0x00

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

export const PROCESS_ALARM_CHANNEL_NAMES_BY_ID = {
  0: 'strain',
  1: 'device temperature',
} as const

export const DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE = {
  0: 'generic',
  1: 'device dependent',
} as const

export const DEVICE_ALARM_TYPES = {
  'low battery alarm': 0,
  'duty cycle alarm': 4,
} as const

export const TECHNICAL_ALARM_TYPES = {
  'Punctual sensor error': 1,
  'Permanent sensor error': 4,
} as const

export const PRODUCT_SUB_ID_NAMES = {
  LoRaWAN: 0,
  MIOTY: 1,
} as const

export const STRAIN_TYPES_BY_ID = {
  1: 'absolute',
  2: 'gauge / relative',
} as const

export const PHYSICAL_UNIT_NAMES_BY_ID = {
  1: 'inH2O',
  2: 'inHg',
  3: 'ftH2O',
  4: 'mmH2O',
  5: 'mmHg',
  6: 'psi',
  7: 'bar',
  8: 'mbar',
  9: 'g/cm²',
  10: 'kg/cm²',
  11: 'Pa',
  12: 'kPa',
  13: 'Torr',
  14: 'at',
  29: 'strain / dehnung',
  32: '°C',
  33: '°F',
  45: 'N',
  47: 'KN',
  55: 'kg',
  56: 'g',
  145: 'inH2O (60 °F)',
  170: 'cmH2O (4 °C)',
  171: 'mH2O (4 °C)',
  172: 'cmHg',
  173: 'lb/ft²',
  174: 'hPa',
  175: 'psia',
  176: 'kg/m²',
  177: 'ftH2O (4 °C)',
  178: 'ftH2O (60 °F)',
  179: 'mHg',
  180: 'Mpsi',
  185: 'µeps',
  237: 'MPa',
  238: 'inH2O (4 °C)',
  239: 'mmH2O (4 °C)',
} as const

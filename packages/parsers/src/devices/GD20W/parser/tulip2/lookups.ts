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

export const SENSOR_TECHNICAL_ALARMS_BY_ID = {
  0: 'modbus sensor communication error',
  1: 'internal pressure sensor signal above upper limit',
  3: 'internal temperature sensor signal below lower limit (< -40°C | -40°F)',
  4: 'internal temperature sensor signal above upper limit (> 80°C | 178°F)',
  5: 'communication error with internal pressure or temperature sensor',
  6: 'liquefaction of SF6 detected (internal sensor)',
  7: 'gas density above upper limit (based on the full scale of the density measuring range in bar abs. at 20°C | 68°F)',
  10: 'recurring modbus communication error',
} as const

export const SENSOR_TECHNICAL_ALARM_VALID_BITS = [0, 1, 3, 4, 5, 6, 7, 10] as const

export const DEVICE_ALARMS_BY_ID = {
  0: 'low battery',
  2: 'duty cycle alarm',
  3: 'configuration error',
  8: 'device specific alarm',
  9: 'device specific alarm',
  10: 'device specific alarm',
  11: 'device specific alarm',
  12: 'device specific alarm',
  13: 'device specific alarm',
  14: 'device specific alarm',
  15: 'device specific alarm',
} as const

export const DEVICE_ALARM_VALID_BITS = [0, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15] as const

export const CONFIGURATION_STATUS_BY_ID = {
  0x02: 'configuration successful',
  0x03: 'configuration rejected',
  0x04: 'configuration discarded',
  0x06: 'command success',
  0x07: 'command failed',
} as const

export const UNITS_BY_ID = {
  0x01: '°C',
  0x02: '°F',
  0x03: 'K',
  0x07: 'bar',
  0x0A: 'Pa',
  0x0C: 'kPa',
  0x0D: 'MPa',
  0x0E: 'Psi',
  0x11: 'N/cm²',
  0x6E: 'kg/m³',
  0x73: 'g/l',
} as const

export const MEASURANDS_BY_ID = {
  0x01: 'Temperature',
  0x03: 'Pressure gauge',
  0x04: 'Pressure absolute',
  0x17: 'Density',
  0x18: 'Density (gauge pressure at 20 °C)',
  0x19: 'Density (absolute pressure at 20 °C)',
} as const

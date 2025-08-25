export const ALARM_EVENT_NAMES_DICTIONARY = ['triggered', 'disappeared'] as const
export const PROCESS_ALARM_TYPE_NAMES_DICTIONARY = [
  'low threshold',
  'high threshold',
  'falling slope',
  'rising slope',
  'low threshold with delay',
  'high threshold with delay',
] as const
export const TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY = [
  'no alarm',
  'open condition',
  'short condition',
  'saturated low',
  'saturated high',
  'ADC communication error',
] as const
export const CONFIGURATION_STATUS_NAMES_DICTIONARY = {
  0x20: 'configuration successful',
  0x30: 'configuration rejected',
  0x60: 'command successful',
  0x70: 'command failed',
} as const

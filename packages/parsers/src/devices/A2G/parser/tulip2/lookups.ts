// Lookup tables derived from the legacy A2G JavaScript codec implementation.
// These const objects are consumed by the TULIP2 codec implementation and
// the accompanying valibot schemas.

export const MESSAGE_TYPES = {
  1: 'DATA_MESSAGE',
  4: 'TECHNICAL_ALARM',
  5: 'DEVICE_ALARM',
  7: 'DEVICE_IDENTIFICATION',
  8: 'KEEP_ALIVE',
} as const

export const MEASUREMENT_CHANNELS = {
  pressure: 0,
  flow: 1,
  input_1: 2,
  input_2: 3,
  input_3: 4,
  input_4: 5,
  relay_status_1: 6,
  relay_status_2: 7,
} as const

export const PRODUCT_SUB_ID_NAMES = {
  0: 'LoRaWAN',
  1: 'MIOTY',
} as const satisfies Record<number, string>

export const HARDWARE_ASSEMBLY_TYPE_NAMES = {
  0: 'A2G HE0 Full Assembly',
  1: 'A2G HE1 1AO Assembly',
  2: 'A2G HE2 Modbus Assembly',
  3: 'A2G HE3 Modular Assembly',
  128: 'A2G LC1 LC1VAO',
  129: 'A2G LC2 CT',
  130: 'A2G LC3 BAT',
} as const satisfies Record<number, string>

export const LPP_MEASURAND_NAMES_PRESSURE = {
  3: 'Pressure (gauge)',
  4: 'Pressure (absolute)',
  5: 'Pressure (differential)',
} as const satisfies Record<number, string>

export const LPP_MEASURAND_NAMES_FLOW = {
  6: 'Flow (vol.)',
  7: 'Flow (mass)',
} as const satisfies Record<number, string>

export const LPP_MEASURAND_NAMES_INPUT = {
  70: 'Input 1',
  71: 'Input 2',
  72: 'Input 3',
  73: 'Input 4',
} as const satisfies Record<number, string>

export const LPP_MEASURAND_NAMES = {
  1: 'Temperature',
  2: 'Temperature difference',
  ...LPP_MEASURAND_NAMES_PRESSURE,
  ...LPP_MEASURAND_NAMES_FLOW,
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
  ...LPP_MEASURAND_NAMES_INPUT,
  75: 'Relay Status 1',
  76: 'Relay Status 2',
} as const satisfies Record<number, string>

export const LPP_UNIT_NAMES_PRESSURE = {
  1: 'Pa',
  2: 'kPa',
  3: 'mbar',
  4: 'mmWC',
  5: 'inWC',
} as const satisfies Record<number, string>

export const LPP_UNIT_NAMES_FLOW = {
  10: '[m³/s] cubic metre per second',
  11: '[m³/h] cubic metre per hour (cbm/h)',
  12: '[l/s] litre per second',
  13: '[cfm] cubic feet per minute',
  14: '[m/s]',
  15: '[ft/min]',
} as const satisfies Record<number, string>

export const LPP_UNIT_NAMES_INPUT = {
  0: 'None',
  20: '% rH',
  21: '[g/m³]',
  22: '[g/ft³]',
  23: '[kJ/kg]',
  24: '[BTU/lb]',
  30: 'normalized',
  31: 'ppm',
  32: '[%] percent',
  40: '°C',
  41: '°F',
  45: 'V',
  46: 'bin',
} as const satisfies Record<number, string>

export const LPP_UNIT_NAMES = {
  ...LPP_UNIT_NAMES_PRESSURE,
  ...LPP_UNIT_NAMES_FLOW,
  ...LPP_UNIT_NAMES_INPUT,
} as const satisfies Record<number, string>

export const TECHNICAL_ALARM_FLAGS = [
  { name: 'PressureSignalOverload', mask: 0b0000_0001 },
  { name: 'AnalogOutput1SignalOverload', mask: 0b0000_0010 },
  { name: 'AnalogOutput2SignalOverload', mask: 0b0000_0100 },
  { name: 'ModbusCommunicationError', mask: 0b0000_1000 },
  { name: 'VoltageInput1SignalOverload', mask: 0b0001_0000 },
  { name: 'VoltageInput2SignalOverload', mask: 0b0010_0000 },
  { name: 'TemperatureInput3SignalOverload', mask: 0b0100_0000 },
  { name: 'TemperatureInput4SignalOverload', mask: 0b1000_0000 },
] as const

export const DEVICE_ALARM_FLAGS = [
  { name: 'ADCConverterError', mask: 0b1000_0000, byteIndex: 2 },
  { name: 'PressureSensorNoResponseError', mask: 0b0100_0000, byteIndex: 2 },
  { name: 'PressureSensorTimeoutError', mask: 0b0010_0000, byteIndex: 2 },
  { name: 'FactoryOptionsWriteError', mask: 0b0001_0000, byteIndex: 2 },
  { name: 'FactoryOptionsDeleteError', mask: 0b0000_1000, byteIndex: 2 },
  { name: 'InvalidFactoryOptionsError', mask: 0b0000_0100, byteIndex: 2 },
  { name: 'UserSettingsInvalidError', mask: 0b0000_0010, byteIndex: 2 },
  { name: 'UserSettingsReadWriteError', mask: 0b0000_0001, byteIndex: 2 },
  { name: 'ZeroOffsetOverRangeError', mask: 0b1000_0000, byteIndex: 3 },
  { name: 'InvalidSignalSourceSpecifiedError', mask: 0b0100_0000, byteIndex: 3 },
  { name: 'AnalogOutput2OverTemperatureError', mask: 0b0010_0000, byteIndex: 3 },
  { name: 'AnalogOutput2LoadFaultError', mask: 0b0001_0000, byteIndex: 3 },
  { name: 'AnalogOutput2OverRangeError', mask: 0b0000_1000, byteIndex: 3 },
  { name: 'AnalogOutput1OverTemperatureError', mask: 0b0000_0100, byteIndex: 3 },
  { name: 'AnalogOutput1LoadFaultError', mask: 0b0000_0010, byteIndex: 3 },
  { name: 'AnalogOutput1OverRangeError', mask: 0b0000_0001, byteIndex: 3 },
] as const

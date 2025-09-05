export const spontaneousStatusLookup = {
  0: 'Success',
  1: 'Unsupported command',
  2: 'Logical error',
  3: 'Memory error',
  4: 'Device error',
  5: 'Wrong frame format',
  6: 'Communication session lock',
} as const

export const productSubIdLookup = {
  0x01: 'BLE only',
  0x02: 'LoRaWAN class A',
  0x03: 'LoRaWAN class B',
  0x04: 'LoRaWAN class C',
  0x05: 'Mioty class Z',
  0x06: 'Mioty class A',
  0x07: 'Mioty class B',
} as const

/**
 * ! CURRENTLY NOT USED
 */
export const LoRaWANChannelPlanLookup = {
  1: 'EU868',
  2: 'US915',
  3: 'CN779',
  4: 'EU433',
  5: 'AU915',
  6: 'CN470',
  7: 'AS923',
  8: 'AS923-2',
  9: 'AS923-3',
  10: 'KR920',
  11: 'IN865',
  12: 'RU864',
  13: 'AS923-4',
} as const

/**
 * ! CURRENTLY NOT USED
 */
export const MiotyChannelPlanLookup = {
  1: 'EU868A',
  2: 'EU868',
  3: 'EU433',
  4: 'US915W',
  5: 'IN868',
  6: 'CN510',
} as const

export const configurationStatusLookup = {
  0: 'Configuration received but not applied',
  1: 'Configuration received and applied with success',
  2: 'Configuration rejected - Tried to write a read only register',
  3: 'Configuration rejected - At least one register has an invalid value',
  4: 'Configuration rejected - The combination register start address/number of bytes is wrong',
  5: 'Entire configuration discarded because of invalid parameter combination',
  6: 'Entire configuration discarded because no answer from the cloud',
  7: 'Missing frame',
  8: 'Frame rejected - frame number already received',
  // 9-255: RFU (Reserved for Future Use)
} as const

export const protocolDataTypeLookup = {
  0: 'float - IEEE754',
  1: 'int 24 - Fixed-point s16.7 (Q16.7)',
  2: 'int 16 - Fixed-point s10.5 (Q10.5)',
  3: 'uint16 - TULIP scale 2500 - 12500',
} as const

export const protocolDataTypeLengthLookup = {
  'float - IEEE754': 4,
  'int 24 - Fixed-point s16.7 (Q16.7)': 3,
  'int 16 - Fixed-point s10.5 (Q10.5)': 2,
  'uint16 - TULIP scale 2500 - 12500': 2,
} as const satisfies Record<typeof protocolDataTypeLookup[keyof typeof protocolDataTypeLookup], number>

export const measurandLookup = {
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
  18: 'Relative', // e.g. charge state, potentiometer tapping
  19: 'Time',
  20: 'Frequency',
  21: 'Speed',
  22: 'Acceleration',
  23: 'Density',
  24: 'Density (gauge pressure at 20 °C)', // Pressure units
  25: 'Density (absolute pressure at 20 °C)', // Pressure units
  26: 'Humidity (relative)',
  27: 'Humidity (absolute)', // Density units
  28: 'Angle of rotation / inclination',
  // RFU (device-specific)
/*   60: 'RFU (device-specific)',
  61: 'RFU (device-specific)',
  62: 'RFU (device-specific)', */
} as const

export const unitsLookup = {
  // Temperature
  1: '°C', // degree Celsius
  2: '°F', // degree Fahrenheit
  3: 'K', // Kelvin
  4: '°R', // degree Rankine

  // Pressure
  7: 'bar', // bar
  8: 'mbar', // millibar
  9: 'μbar', // microbar
  10: 'Pa', // Pascal (N/m2)
  11: 'hPa', // hectopascal
  12: 'kPa', // kilopascal
  13: 'MPa', // megapascal
  14: 'psi', // pound per square inch (lbf/in2, lb/in2)
  15: 'lbf/ft²', // pound per square foot
  16: 'kN/m²', // kilonewton / square metre
  17: 'N/cm²', // newton / square centimetre
  18: 'atm', // standard atmosphere
  19: 'kg/cm²', // (kp/cm2, at technical atmosphere)
  20: 'kg/mm²', // (kp/mm2)
  21: 'μmHg', // micrometre of mercury (micron, milli-Torr)
  22: 'mmHg', // millimetre of mercury (Torr)
  23: 'cmHg', // centimetre of mercury
  24: 'inHg', // inch of mercury
  25: 'mmH2O', // millimetre of water
  26: 'mH2O', // metre of water
  27: 'inH2O', // inch of water
  28: 'ftH2O', // foot of water

  // Force
  45: 'N', // newton
  46: 'daN', // decanewton
  47: 'kN', // kilonewton
  48: 'MN', // meganewton
  49: 'kp', // kilopond
  50: 'lbf', // pound-force
  51: 'ozf', // ounce-force
  52: 'dyn', // dyne

  // Mass
  55: 'kg', // kilogram
  56: 'g', // gram
  57: 'mg', // milligram
  58: 'lb', // pound

  // Length
  60: 'mm', // millimetre
  61: 'cm', // centimetre
  62: 'm', // metre
  63: 'μm', // micrometre
  64: 'ft', // foot
  65: 'in', // inch

  // Volume
  70: 'l', // litre
  71: 'ml', // millilitre
  72: 'm³', // cubic metre
  73: 'gal (UK)', // imperial gallon (UK)
  74: 'gal (US)', // US gallon (US)
  75: 'ft³', // cubic foot
  76: 'in³', // cubic inch

  // Resistance
  82: 'mΩ', // milliohm
  83: 'Ω', // ohm
  84: 'kΩ', // kiloohm

  // Voltage
  86: 'μV', // microvolt
  87: 'mV', // millivolt
  88: 'V', // volt

  // Current
  90: 'mA', // milliampere
  91: 'μA', // microampere

  // Capacitance
  93: 'μF', // microfarad
  94: 'nF', // nanofarad
  95: 'pF', // picofarad

  // Inductance
  97: 'mH', // millihenry
  98: 'μH', // microhenry

  // Relative
  100: '%', // percent
  101: '‰', // per mille
  102: 'ppm', // parts per million

  // Angle
  105: '°', // degree
  106: 'rad', // radian

  // Counter
  108: 'counts', // counts, counter value

  // Density
  110: 'kg/m³', // kilogram per cubic metre
  111: 'g/m³', // gram per cubic metre
  112: 'mg/m³', // milligram per cubic metre
  113: 'μg/m³', // microgram per cubic metre
  114: 'kg/l', // kilogram per litre
  115: 'g/l', // gram per litre
  116: 'lb/ft³', // pound per cubic foot

  // Flow (vol.)
  120: 'l/min', // litre per minute
  121: 'l/s', // litre per second
  122: 'm³/h', // cubic metre per hour (cbm/h)
  123: 'm³/s', // cubic metre per second
  124: 'cfm', // cubic feet per minute

  // Flow (mass)
  140: 'kg/s', // kilogram per second
  141: 'kg/h', // kilogram per hour

  // Time
  160: 's', // second
  161: 'min', // minute
  162: 'h', // hour
  163: 'd', // day

  // Frequency
  167: 'Hz', // hertz
  168: 'kHz', // kilohertz

  // Speed
  170: 'm/s', // metre per second
  171: 'cm/s', // centimetre per second
  172: 'ft/min', // foot per minute
  173: 'ft/s', // foot per second

  // Acceleration
  180: 'm/s²', // metre per second squared
  181: 'ft/s²', // foot per second squared

  // RFU (device-specific)
/*   250: 'RFU', // RFU (device-specific)
  251: 'RFU', // RFU (device-specific)
  252: 'RFU', // RFU (device-specific)
  253: 'RFU', // RFU (device-specific) */
} as const

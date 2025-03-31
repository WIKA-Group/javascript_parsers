/* &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&#    &&&
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&#    &&&
&&&                                                                                               &&#    &&&
&&&    .&&&&&      .&&&&&      &&&&&&    &&&&&     .&&&&/     .&&&&&&          &&&&&&&&           &&#    &&&
&&&     &&&&&&     &&&&&&&     &&&&&     &&&&&     .&&&&/   &&&&&&&           &&&&&&&&&&          &&#    &&&
&&&      &&&&&(   &&&&&&&&#   &&&&&(     &&&&&     .&&&&/ &&&&&&             &&&&& /&&&&&         &&#    &&&
&&&       &&&&&  /&&&&,&&&&  ,&&&&&      &&&&&     .&&&&&&&&&&&             &&&&&   &&&&&%        &&#    &&&
&&&       %&&&&& &&&&  &&&&& &&&&&       &&&&&     .&&&&&&&&&&&&&          &&&&&%    &&&&&(       &&#    &&&
&&&        &&&&&&&&&(   &&&&&&&&&.       &&&&&     .&&&&&   &&&&&&#       &&&&&&&&&&&&&&&&&.      &&#    &&&
&&&         &&&&&&&&     &&&&&&&&        &&&&&     .&&&&/     &&&&&&     *&&&&&        &&&&&      &&#    &&&
&&&          &&&&&&      /&&&&&&         &&&&&     .&&&&/       &&&&&&   &&&&&         #&&&&&     &&#    &&&
&&&                                                                                                      &&&
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& */
/**
 * General information:
 * This JavaScript-based payload formatter is a parser to decode data from bytes into
 * JSON Object. It can only parse payload from GD-20-W devices.
 * This parser follows the specification LoRaWAN® Payload Codec API Specification TS013-1.0.0.
 *
 * SPDX-FileCopyrightText: Copyright (C) 2024 WIKA Alexander Wiegand SE & Co. KG
 * SPDX-License-Identifier: MIT
 *
 * SPDX-FileName: index.js
 * SPDX-PackageVersion: 2.0.0
 */
// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************

let CHANNEL0_RANGE_START = 4
let CHANNEL0_RANGE_END = 20
let CHANNEL1_RANGE_START = 4
let CHANNEL1_RANGE_END = 20
let CHANNEL2_RANGE_START = 4
let CHANNEL2_RANGE_END = 20
let CHANNEL3_RANGE_START = 4
let CHANNEL3_RANGE_END = 20
let CHANNEL4_RANGE_START = 4
let CHANNEL4_RANGE_END = 20
let CHANNEL5_RANGE_START = 4
let CHANNEL5_RANGE_END = 20

export type fPort = number

export interface Input {
  /**
   * The uplink payload byte array, where each byte is represented by an integer between 0 and 255.
   *  @type: {integer[]}
   */
  bytes: number[]
  /**
   * The uplink message LoRaWAN `fPort`
   *  @type: {int}
   */
  fPort: fPort
  /**
   * ISO 8601 string representation of the time the message was received by the network server.
   */
  recvTime: string
}

type ChannelId = 0 | 1 | 2 | 3 | 4 | 5

export interface BaseMessage {
  warnings?: OutputWarning[]
}

export interface BaseData<TMessage extends number = number> {
  messageType: TMessage
  configurationId: number
}

export type OutputSuccessfulMeasurements = BaseMessage & {
  data: BaseData<0x01 | 0x02> & {
    measurements: {
      channels: Array<{
        channelId: ChannelId
        value: number
      }>
    }
  }
}

export type OutputSuccessfulProcessAlarms = BaseMessage & {
  data: BaseData<0x03> & {
    processAlarms: Array<{
      channelId: ChannelId
      event: 0 | 1
      eventName: (typeof ALARM_EVENT_NAMES_DICTIONARY)[number]
      alarmType: number
      alarmTypeName: (typeof PROCESS_ALARM_TYPE_NAMES_DICTIONARY)[number]
      value: number
    }>
  }
}

type SensorAlarmType = 0 | 1 | 3 | 4 | 5 | 6 | 7 | 10

export type OutputSuccessfulSensorTechnicalAlarms = BaseMessage & {
  data: BaseData<0x04> & {
    sensorTechnicalAlarms: Array<{
      channelId: ChannelId
      alarmType: SensorAlarmType
      alarmDescription:
      (typeof SENSOR_TECHNICAL_ALARMS_DESCRIPTION_DICTIONARY)[
        keyof typeof SENSOR_TECHNICAL_ALARMS_DESCRIPTION_DICTIONARY
      ]
    }>
  }
}

type DeviceAlarmType = 0 | 2 | 3 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

export type OutputSuccessfulDeviceALarms = BaseMessage & {
  data: BaseData<0x05> & {
    deviceAlarms: Array<{
      alarmType: DeviceAlarmType
      alarmDescription:
      (typeof DEVICE_ALARMS_DICTIONARY)[
        keyof typeof DEVICE_ALARMS_DICTIONARY
      ]
    }>
  }
}

export interface MainConfigurationData {
  acquisitionTimeAlarmsOff: number | 'unauthorized'
  publicationTimeFactorAlarmsOff: number | 'unauthorized'
  acquisitionTimeAlarmsOn: number | 'unauthorized'
  publicationTimeFactorAlarmsOn: number | 'unauthorized'
}
export interface ChannelConfigurationData {
  sensorOrChannelId: number
  deadBand: number
  alarm1Threshold?: number
  alarm2Threshold?: number
  alarm3Slope?: number
  alarm4Slope?: number
  alarm5Threshold?: number
  alarm5Period?: number
  alarm6Threshold?: number
  alarm6Period?: number
}

export type OutputSuccessfulConfigurationStatus = BaseMessage & {
  data: BaseData<0x06> & {
    configurationStatus:
      & {
        status: number
        statusDescription:
        (typeof CONFIGURATION_STATUS_NAMES_DICTIONARY)[
          keyof typeof CONFIGURATION_STATUS_NAMES_DICTIONARY
        ]
        commandType: number
      }
      & (
        | {
          commandType: 0x04
          mainConfiguration: MainConfigurationData
        }
        | {
          commandType: number
          channelConfiguration: ChannelConfigurationData
        }
      )
  }
}

export type OutputSuccessfulDeviceIdentification = BaseMessage & {
  data: BaseData<0x07> & {
    deviceIdentification: {
      productId: 0x15
      productSubId: 0x40
      wirelessModuleFirmwareVersion: `${number}.${number}.${number}`
      wirelessModuleHardwareVersion: `${number}.${number}.${number}`
      serialNumber: string
      channels: {
        channel0: {
          measurand:
          (typeof MEASURAND_DICTIONARY)[keyof typeof MEASURAND_DICTIONARY]
          unit: (typeof UNIT_DICTIONARY)[keyof typeof UNIT_DICTIONARY]
        }
        channel1: {
          measurand:
          (typeof MEASURAND_DICTIONARY)[keyof typeof MEASURAND_DICTIONARY]
          unit: (typeof UNIT_DICTIONARY)[keyof typeof UNIT_DICTIONARY]
        }
        channel2: {
          measurand:
          (typeof MEASURAND_DICTIONARY)[keyof typeof MEASURAND_DICTIONARY]
          unit: (typeof UNIT_DICTIONARY)[keyof typeof UNIT_DICTIONARY]
        }
        channel3: {
          measurand:
          (typeof MEASURAND_DICTIONARY)[keyof typeof MEASURAND_DICTIONARY]
          unit: (typeof UNIT_DICTIONARY)[keyof typeof UNIT_DICTIONARY]
        }
        channel4: {
          measurand:
          (typeof MEASURAND_DICTIONARY)[keyof typeof MEASURAND_DICTIONARY]
          unit: (typeof UNIT_DICTIONARY)[keyof typeof UNIT_DICTIONARY]
        }
        channel5: {
          measurand:
          (typeof MEASURAND_DICTIONARY)[keyof typeof MEASURAND_DICTIONARY]
          unit: (typeof UNIT_DICTIONARY)[keyof typeof UNIT_DICTIONARY]
        }
      }
      gasMixtures: {
        SF6: number
        N2: number
        CF4: number
        O2: number
        C02: number
        Novec4710: number
        He: number
        Ar: number
      }
    }
  }
}

export type OutputSuccessfulKeepAlive = BaseMessage & {
  data: BaseData<0x08> & {
    batteryLevelIndicator: {
      restartedSinceLastKeepAlive: boolean
      batteryLevelPercent: number
      batteryLevelCalculationError: boolean
      batteryPresent: boolean
    }
  }
}

export type OutputSuccessfulExtendedDeviceIdentification = BaseMessage & {
  data: BaseData<0x09> & {
    channelRanges: {
      channel0: {
        max: number
        min: number
      }
      channel1: {
        max: number
        min: number
      }
      channel2: {
        max: number
        min: number
      }
      channel3: {
        max: number
        min: number
      }
      channel4: {
        max: number
        min: number
      }
      channel5: {
        max: number
        min: number
      }
    }
  }
}

export type OutputSuccessful =
  | OutputSuccessfulMeasurements
  | OutputSuccessfulProcessAlarms
  | OutputSuccessfulSensorTechnicalAlarms
  | OutputSuccessfulDeviceALarms
  | OutputSuccessfulConfigurationStatus
  | OutputSuccessfulDeviceIdentification
  | OutputSuccessfulKeepAlive
  | OutputSuccessfulExtendedDeviceIdentification

// ! This is like spec.
export interface OutputFailure {
  /**
   * A list of error messages while decoding the provided payload.
   */
  errors: OutputError[]
}

export type OutputWarning = string
export type OutputError = string

type MeasurementChannelEntry =
  OutputSuccessfulMeasurements['data']['measurements']['channels'][number]

export type UplinkOutput = OutputSuccessful | OutputFailure

// ***********************************************************************************
// Public Decoding Section
// ***********************************************************************************

function decodeUplink(input: Input): UplinkOutput {
  return decode(input)
}

function decodeHexString(
  fPort: fPort,
  hexEncodedString: string,
): OutputSuccessful | OutputFailure {
  // remove all spaces
  hexEncodedString = hexEncodedString.replace(/\s/g, '')

  const validResult = isValidHexString(hexEncodedString)
  if (!validResult.result) {
    return createErrorMessage([validResult.reason!])
  }
  const bytes = convertHexStringToBytes(hexEncodedString)

  // check if its OutputFailure
  if ('errors' in bytes) {
    return bytes
  }

  return decode({ bytes, fPort, recvTime: new Date().toISOString() })
}

function decodeBase64String(
  fPort: fPort,
  base64EncodedString: string,
): OutputSuccessful | OutputFailure {
  const bytes = convertBase64StringToBytes(base64EncodedString)

  return decode({ bytes, fPort, recvTime: new Date().toISOString() })
}

// ***********************************************************************************
// Private Decoding Section
// ***********************************************************************************

const DEVICE_NAME = 'GD-20-W'

const ALARM_EVENT_NAMES_DICTIONARY = ['triggered', 'disappeared'] as const
const PROCESS_ALARM_TYPE_NAMES_DICTIONARY = [
  'low threshold',
  'high threshold',
  'falling slope',
  'rising slope',
  'low threshold with delay',
  'high threshold with delay',
] as const
// no alarm is not here as it is note an alarm "cause"
// thus indices are shifted by "1" when reading from the dictionary
const SENSOR_TECHNICAL_ALARMS_DESCRIPTION_DICTIONARY = {
  0: 'modbus sensor communication error',
  1: 'internal pressure sensor signal above upper limit',
  3: 'internal temperature sensor signal below lower limit (< -40°C | -40°F)',
  4: 'internal temperature sensor signal above upper limit (> 80°C | 178°F)',
  5: 'communication error with internal pressure or temperature sensor',
  6: 'liquefaction of SF6 detected (internal sensor)',
  7: 'gas density above upper limit (based on the full scale of the density measuring range in bar abs. at 20°C | 68°F)',
  10: 'recurring modbus communication error',
} as const

const DEVICE_ALARMS_DICTIONARY = {
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

const CONFIGURATION_STATUS_NAMES_DICTIONARY = {
  0x02: 'configuration successful',
  0x03: 'configuration rejected',
  0x04: 'configuration discarded',
  0x06: 'command success',
  0x07: 'command failed',
} as const

const UNIT_DICTIONARY = {
  0x01: '°C', // degree Celsius
  0x02: '°F', // degree Fahrenheit
  0x03: 'K', // Kelvin
  0x07: 'bar', // Bar
  0x0A: 'Pa', // Pascal
  0x0C: 'kPa', // Kilopascal
  0x0D: 'MPa', // Megapascal
  0x0E: 'Psi', // Pound per square inch
  0x11: 'N/cm²', // Newton per square centimeter
  0x6E: 'kg/m³', // Kilogram per cubic metre
  0x73: 'g/l', // Gram per liter
} as const

const MEASURAND_DICTIONARY = {
  0x01: 'Temperature',
  0x03: 'Pressure gauge',
  0x04: 'Pressure absolute',
  0x17: 'Density',
  0x18: 'Density (gauge pressure at 20 °C)',
  0x19: 'Density (absolute pressure at 20 °C)',
} as const

function decode(input: Input): OutputSuccessful | OutputFailure {
  // Validate input
  const validationResult = validateInput(input)
  if ('errors' in validationResult) {
    return validationResult
  }

  input = validationResult

  const firstByte = input.bytes[0]

  switch (firstByte) {
    // Data message with no alarm ongoing
    case 0x01:
      return decodeDataMessage(input)

      // Data message with at least one alarm ongoing
    case 0x02:
      return decodeDataMessage(input)

      // Process alarm message
    case 0x03:
      return decodeProcessAlarmMessage(input)

      // Technical alarm message
    case 0x04:
      return decodeSensorTechnicalAlarmMessage(input)

    case 0x05:
      return decodeDeviceAlarmMessage(input)

      // Configuration status message
    case 0x06:
      return decodeConfigurationStatusMessage(input)

      // Radio unit identification message
    case 0x07:
      return decodeDeviceIdentificationMessage(input)

      // Keep alive message
    case 0x08:
      return decodeKeepAliveMessage(input)

    case 0x09:
      return decodedExtendedDeviceIdentificationMessage(input)

      // Unsupported message type
    default:
      return createErrorMessage([
        `Data message type ${firstByte} is not supported`,
      ])
  }
}

/**
 * Validate the input object
 * @param input The input object to validate
 * @returns The validated input object or an error object
 */
function validateInput(input: unknown): Input | OutputFailure {
  if (input === null || input === undefined) {
    return createErrorMessage(['Input is missing'])
  }

  if (typeof input !== 'object' || Array.isArray(input)) {
    return createErrorMessage(['\'input\' must be an object'])
  }

  const castInput = input as {
    bytes?: unknown
    fPort?: unknown
    recvTime?: unknown
  }

  if (!Array.isArray(castInput.bytes)) {
    return createErrorMessage(['input.bytes must be an array'])
  }

  if (
    !castInput.bytes.every((byte): byte is number =>
      isInteger(byte) && byte >= 0 && byte <= 255,
    )
  ) {
    return createErrorMessage([
      '\'input.bytes\' must be an array of integers between 0 and 255',
    ])
  }

  if (typeof castInput.fPort !== 'number') {
    return createErrorMessage(['\'input.fPort\' must be a number'])
  }

  // Left out for now as it is not used in the decoding
  /*
  if (typeof castInput.recvTime !== 'string') {
    return createErrorMessage(["'input.recvTime' must be an ISO 8601 datetime string"])
  } */

  return {
    bytes: castInput.bytes,
    fPort: castInput.fPort,
    recvTime: castInput.recvTime,
  } as Input
}

function decodeDataMessage(
  input: Input,
): OutputSuccessfulMeasurements | OutputFailure {
  const minLengthForData = 2

  if (input.bytes.length < minLengthForData) {
    return createErrorMessage([
      `Data message must contain at least ${minLengthForData + 3} bytes`,
    ])
  }

  const invalidLength = (input.bytes.length - 2) % 3 !== 0

  const warnings: OutputWarning[] = []

  if (invalidLength) {
    addWarningMessages(warnings, [
      `Data message contains an invalid number of bytes. Bytes must have a length of 2 + 3n (n = 1, 2, 3,...). Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x01 | 0x02
  const configurationId = input.bytes[1]!

  const rawChannelData = input.bytes.slice(2)
  const splitChannelData = []

  for (let i = 0; i < rawChannelData.length; i += 3) {
    if (i + 2 < rawChannelData.length) {
      splitChannelData.push(rawChannelData.slice(i, i + 3))
    }
  }

  const channelData = splitChannelData.map((channel) => {
    return createChannelData(
      channel[0] as ChannelId,
      (channel[1]! << 8) | channel[2]!,
    )
  })

  const res: OutputSuccessfulMeasurements = {
    data: {
      messageType,
      configurationId,
      measurements: {
        channels: channelData,
      },
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

function decodeProcessAlarmMessage(
  input: Input,
): OutputSuccessfulProcessAlarms | OutputFailure {
  const minLengthBytes = 6

  if (input.bytes.length < minLengthBytes) {
    return createErrorMessage([
      `Process alarm message must contain at least ${minLengthBytes} bytes. Contains ${input.bytes.length} bytes.`,
    ])
  }
  // bytes must have a length of 6, 10, 14, ... (4n + 6)
  if ((input.bytes.length - 2) % 4 !== 0) {
    return createErrorMessage([
      `Process alarm message must contain 4n + 6 bytes, contains ${input.bytes.length}.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x03
  const configurationId = input.bytes[1]!

  // 3rd byte is reserved

  // get every alarm entry that is 4 bytes long but ignore the first 2 bytes
  const processAlarms: OutputSuccessfulProcessAlarms['data']['processAlarms']
    = []
  for (let i = 2; i < input.bytes.length; i += 4) {
    const sensor_or_channelId = input.bytes[i]! as ChannelId
    const alarmType = input.bytes[i + 1]!
    const alarmValue1 = input.bytes[i + 2]!
    const alarmValue2 = input.bytes[i + 3]!
    const processAlarmType = getProcessAlarmType(alarmType)
    if ('errors' in processAlarmType) {
      return processAlarmType
    }

    const processAlarmRelatedValue = getProcessAlarmRelatedValue(
      alarmValue1,
      alarmValue2,
      sensor_or_channelId,
      processAlarmType.alarmType,
    )
    processAlarms.push({
      channelId: sensor_or_channelId,
      alarmType: processAlarmType.alarmType,
      alarmTypeName:
        PROCESS_ALARM_TYPE_NAMES_DICTIONARY[processAlarmType.alarmType]!,
      event: processAlarmType.sense,
      eventName: ALARM_EVENT_NAMES_DICTIONARY[processAlarmType.sense]!,
      value: processAlarmRelatedValue,
    })
  }

  return {
    data: {
      messageType,
      configurationId,
      processAlarms,
    },
  }
}

function decodeSensorTechnicalAlarmMessage(
  input: Input,
): OutputSuccessfulSensorTechnicalAlarms | OutputFailure {
  const maxLengthBytes = 5
  const warnings: OutputWarning[] = []

  if (input.bytes.length > maxLengthBytes) {
    addWarningMessages(warnings, [
      `Sensor technical alarm message contains more than ${maxLengthBytes} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x04
  const configurationId = input.bytes[1]!
  const sensorId = input.bytes[2]!
  const alarmBitMap = (input.bytes[3]! << 8) | input.bytes[4]!

  const validBits = [0, 1, 3, 4, 5, 6, 7, 10]

  const alarms: SensorAlarmType[] = []
  const invalidBitsSet = []

  for (let bit = 0; bit < 16; bit++) {
    if ((alarmBitMap & (1 << bit)) !== 0) {
      if (validBits.includes(bit)) {
        alarms.push(bit as SensorAlarmType)
      }
      else {
        invalidBitsSet.push(bit)
      }
    }
  }

  if (invalidBitsSet.length > 0) {
    addWarningMessages(warnings, [
      `Sensor technical alarm message contains invalid alarm bits: ${
        invalidBitsSet.join(
          ', ',
        )
      }. Only bits 0, 1, 3, 4, 5, 6, 7, 10 are valid.`,
    ])
  }

  const res: OutputSuccessfulSensorTechnicalAlarms = {
    data: {
      messageType,
      configurationId,
      sensorTechnicalAlarms: alarms.map(alarm => ({
        channelId: sensorId as ChannelId,
        alarmType: alarm,
        alarmDescription:
          SENSOR_TECHNICAL_ALARMS_DESCRIPTION_DICTIONARY[alarm]!,
      })),
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

function decodeDeviceAlarmMessage(
  input: Input,
): OutputSuccessfulDeviceALarms | OutputFailure {
  const maxLengthBytes = 4

  if (input.bytes.length < maxLengthBytes) {
    return createErrorMessage([
      `Device alarm message must contain ${maxLengthBytes} bytes. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const warnings: OutputWarning[] = []

  if (input.bytes.length > maxLengthBytes) {
    addWarningMessages(warnings, [
      `Device alarm message contains more than ${maxLengthBytes} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x05
  const configId = input.bytes[1]
  const alarmBitMap = (input.bytes[2]! << 8) | input.bytes[3]!
  const validBits = [0, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15]
  const alarms: DeviceAlarmType[] = []
  const invalidBitsSet = []

  for (let bit = 0; bit < 16; bit++) {
    if ((alarmBitMap & (1 << bit)) !== 0) {
      if (validBits.includes(bit)) {
        alarms.push(bit as DeviceAlarmType)
      }
      else {
        invalidBitsSet.push(bit)
      }
    }
  }

  if (invalidBitsSet.length > 0) {
    addWarningMessages(warnings, [
      `Sensor technical alarm message contains invalid alarm bits: ${
        invalidBitsSet.join(
          ', ',
        )
      }. Only bits 0, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15 are valid.`,
    ])
  }

  const res: OutputSuccessfulDeviceALarms = {
    data: {
      messageType,
      configurationId: configId!,
      deviceAlarms: alarms.map(alarm => ({
        alarmType: alarm,
        alarmDescription: DEVICE_ALARMS_DICTIONARY[alarm]!,
      })),
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

function decodeConfigurationStatusMessage(
  input: Input,
): OutputSuccessfulConfigurationStatus | OutputFailure {
  const warnings: OutputWarning[] = []

  const messageType = input.bytes[0]! as 0x06
  const transactionId = input.bytes[1]!
  const validStatuses = Object.keys(CONFIGURATION_STATUS_NAMES_DICTIONARY).map(
    key => Number.parseInt(key),
  )
  // status are only the last 4 bit but put them into the first 4 bit of a number
  const status = input.bytes[2]! >> 4

  if (!validStatuses.includes(status)) {
    return createErrorMessage([
      `Configuration status message contains an invalid status: ${status}`,
    ])
  }

  const commandType = input.bytes[3]!

  // check if commandType is valid (0x04 or >=0x40)
  if (commandType !== 0x04 && commandType < 0x40) {
    return createErrorMessage([
      `Configuration status message contains an invalid command type: ${commandType}`,
    ])
  }

  const command = commandType === 0x04 ? 'mainConfig' : 'channelConfig'

  if (command === 'mainConfig') {
    const mainConfigLength = 17
    if (input.bytes.length < mainConfigLength) {
      return createErrorMessage([
        `Configuration status message contains an invalid length for main configuration: ${input.bytes.length}`,
      ])
    }
    if (input.bytes.length > mainConfigLength) {
      addWarningMessages(warnings, [
        `Configuration status message for main configuration contains more than ${mainConfigLength} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }
  }
  if (command === 'channelConfig') {
    const channelConfigLength = 8
    const channelConfigMaxLength = 16
    if (input.bytes.length < channelConfigLength) {
      return createErrorMessage([
        `Configuration status message contains an invalid length for channel configuration: ${input.bytes.length}`,
      ])
    }
    if (input.bytes.length > channelConfigMaxLength) {
      addWarningMessages(warnings, [
        `Configuration status message for channel configuration contains more than ${channelConfigMaxLength} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }
  }

  const config = command === 'mainConfig'
    ? getMainConfigurationData(input)
    : getChannelConfigurationData(input)

  const configStatus = command === 'mainConfig'
    ? {
        status,
        statusDescription: CONFIGURATION_STATUS_NAMES_DICTIONARY[
          status as keyof typeof CONFIGURATION_STATUS_NAMES_DICTIONARY
        ]!,
        commandType: commandType as 0x04,
        mainConfiguration: config.data as MainConfigurationData,
      }
    : {
        status,
        statusDescription: CONFIGURATION_STATUS_NAMES_DICTIONARY[
          status as keyof typeof CONFIGURATION_STATUS_NAMES_DICTIONARY
        ]!,
        commandType,
        channelConfiguration: config.data as ChannelConfigurationData,
      }

  const res: OutputSuccessfulConfigurationStatus = {
    data: {
      messageType,
      configurationId: transactionId,
      configurationStatus: configStatus,
    },
  }

  if (warnings.length > 0) {
    res.warnings = res.warnings ? res.warnings.concat(warnings) : warnings
  }

  return res
}

function decodeDeviceIdentificationMessage(
  input: Input,
): OutputSuccessfulDeviceIdentification | OutputFailure {
  const minLength = 39

  const warnings: OutputWarning[] = []

  if (input.bytes.length < minLength) {
    return createErrorMessage([
      `Device identification message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`,
    ])
  }

  if (input.bytes.length > minLength) {
    addWarningMessages(warnings, [
      `Device identification message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x07
  const configurationId = input.bytes[1]!

  const productId = input.bytes[2]! as 0x15
  if (productId !== 0x15) {
    return createErrorMessage([
      `Device identification message contains an invalid product ID: ${productId}, expected 0x15 (21).`,
    ])
  }
  const productSubId = input.bytes[3]! as 0x40
  if (productSubId !== 0x40) {
    return createErrorMessage([
      `Device identification message contains an invalid product sub ID: ${productSubId}, expected 0x00 (0).`,
    ])
  }
  // get the semver version. major,minor are from same byte each 4 bit but patch is full next byte
  const wirelessModuleFirmwareVersion = `${input.bytes[4]! >> 4}.${
    input.bytes[4]! & 0x0F
  }.${input.bytes[5]}` as `${number}.${number}.${number}`
  const wirelessModuleHardwareVersion = `${input.bytes[6]! >> 4}.${
    input.bytes[6]! & 0x0F
  }.${input.bytes[7]}` as `${number}.${number}.${number}`

  const checkSemVerErrors = checkSemVerVersions([
    wirelessModuleFirmwareVersion,
    wirelessModuleHardwareVersion,
  ])
  if (checkSemVerErrors) {
    addWarningMessages(warnings, checkSemVerErrors)
  }
  const SF6 = input.bytes[31]!
  const N2 = input.bytes[32]!
  const CF4 = input.bytes[33]!
  const O2 = input.bytes[34]!
  const C02 = input.bytes[35]!
  const Novec4710 = input.bytes[36]!
  const He = input.bytes[37]!
  const Ar = input.bytes[38]!

  const serialNumberASCII = input.bytes
  // ! here not take the byte 24 as it is 0x00
    .slice(8, 18)
    .map(byte => String.fromCharCode(byte))
    .join('')

  const res: OutputSuccessfulDeviceIdentification = {
    data: {
      messageType,
      configurationId,
      deviceIdentification: {
        productId,
        productSubId,
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber: serialNumberASCII,
        channels: {
          channel0: {
            measurand:
              MEASURAND_DICTIONARY[
                input.bytes[19]! as keyof typeof MEASURAND_DICTIONARY
              ]!,
            unit:
              UNIT_DICTIONARY[
                input.bytes[20]! as keyof typeof UNIT_DICTIONARY
              ]!,
          },
          channel1: {
            measurand:
              MEASURAND_DICTIONARY[
                input.bytes[21]! as keyof typeof MEASURAND_DICTIONARY
              ]!,
            unit:
              UNIT_DICTIONARY[
                input.bytes[22]! as keyof typeof UNIT_DICTIONARY
              ]!,
          },
          channel2: {
            measurand:
              MEASURAND_DICTIONARY[
                input.bytes[23]! as keyof typeof MEASURAND_DICTIONARY
              ]!,
            unit:
              UNIT_DICTIONARY[
                input.bytes[24]! as keyof typeof UNIT_DICTIONARY
              ]!,
          },
          channel3: {
            measurand:
              MEASURAND_DICTIONARY[
                input.bytes[25]! as keyof typeof MEASURAND_DICTIONARY
              ]!,
            unit:
              UNIT_DICTIONARY[
                input.bytes[26]! as keyof typeof UNIT_DICTIONARY
              ]!,
          },
          channel4: {
            measurand:
              MEASURAND_DICTIONARY[
                input.bytes[27]! as keyof typeof MEASURAND_DICTIONARY
              ]!,
            unit:
              UNIT_DICTIONARY[
                input.bytes[28]! as keyof typeof UNIT_DICTIONARY
              ]!,
          },
          channel5: {
            measurand:
              MEASURAND_DICTIONARY[
                input.bytes[29]! as keyof typeof MEASURAND_DICTIONARY
              ]!,
            unit:
              UNIT_DICTIONARY[
                input.bytes[30]! as keyof typeof UNIT_DICTIONARY
              ]!,
          },
        },
        gasMixtures: {
          Ar,
          CF4,
          He,
          N2,
          Novec4710,
          O2,
          SF6,
          C02,
        },
      },
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

function decodeKeepAliveMessage(
  input: Input,
): OutputSuccessfulKeepAlive | OutputFailure {
  const minLength = 3

  const warnings: OutputWarning[] = []

  if (input.bytes.length < minLength) {
    return createErrorMessage([
      `Keep alive message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`,
    ])
  }

  if (input.bytes.length > minLength) {
    addWarningMessages(warnings, [
      `Keep alive message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x08
  const configurationId = input.bytes[1]!

  const indicatorByte = input.bytes[2]!

  const newBatteryEvent = (indicatorByte & 0b1000_0000) === 0x80
  const batteryError = (indicatorByte & 0b0111_1111) === 0x7F
  const batteryPresent = (indicatorByte & 0b1111_1111) !== 0x00
  const batteryEstimation = indicatorByte & 0b0111_1111

  // TODO: doc seems to be wrong here for number of transmissions and measurements

  const res: OutputSuccessfulKeepAlive = {
    data: {
      messageType,
      configurationId,
      batteryLevelIndicator: {
        batteryLevelPercent: batteryEstimation,
        batteryLevelCalculationError: batteryError,
        batteryPresent,
        restartedSinceLastKeepAlive: newBatteryEvent,
      },
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

function decodedExtendedDeviceIdentificationMessage(
  input: Input,
): OutputSuccessfulExtendedDeviceIdentification | OutputFailure {
  const minLength = 50

  const warnings: OutputWarning[] = []

  if (input.bytes.length < minLength) {
    return createErrorMessage([
      `Extended device identification message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`,
    ])
  }

  if (input.bytes.length > minLength) {
    addWarningMessages(warnings, [
      `Extended device identification message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
    ])
  }

  const messageType = input.bytes[0]! as 0x09
  const configurationId = input.bytes[1]!

  const channel0MinRange = getFloat32FromBytes(input.bytes, 2)
  const channel0MaxRange = getFloat32FromBytes(input.bytes, 6)
  const channel1MinRange = getFloat32FromBytes(input.bytes, 10)
  const channel1MaxRange = getFloat32FromBytes(input.bytes, 14)
  const channel2MinRange = getFloat32FromBytes(input.bytes, 18)
  const channel2MaxRange = getFloat32FromBytes(input.bytes, 22)
  const channel3MinRange = getFloat32FromBytes(input.bytes, 26)
  const channel3MaxRange = getFloat32FromBytes(input.bytes, 30)
  const channel4MinRange = getFloat32FromBytes(input.bytes, 34)
  const channel4MaxRange = getFloat32FromBytes(input.bytes, 38)
  const channel5MinRange = getFloat32FromBytes(input.bytes, 42)
  const channel5MaxRange = getFloat32FromBytes(input.bytes, 46)

  const res: OutputSuccessfulExtendedDeviceIdentification = {
    data: {
      messageType,
      configurationId,
      channelRanges: {
        channel0: {
          min: channel0MinRange,
          max: channel0MaxRange,
        },
        channel1: {
          min: channel1MinRange,
          max: channel1MaxRange,
        },
        channel2: {
          min: channel2MinRange,
          max: channel2MaxRange,
        },
        channel3: {
          min: channel3MinRange,
          max: channel3MaxRange,
        },
        channel4: {
          min: channel4MinRange,
          max: channel4MaxRange,
        },
        channel5: {
          min: channel5MinRange,
          max: channel5MaxRange,
        },
      },
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

// #############################UTILS#######################################

function checkSemVerVersions(semVers: string[]): OutputWarning[] | null {
  const warnings: OutputWarning[] = []

  for (const semVer of semVers) {
    const parts = semVer.split('.')
    if (parts.length !== 3) {
      throw new Error(`Invalid semantic version format: ${semVer}`)
    }

    const [majorStr, minorStr, patchStr] = parts
    const major = Number.parseInt(majorStr!)
    const minor = Number.parseInt(minorStr!)
    const patch = Number.parseInt(patchStr!)

    // Check if the parsed int, when converted back to a string, matches the original string
    // This ensures the part was a valid integer
    if (
      major.toString() !== majorStr || minor.toString() !== minorStr
      || patch.toString() !== patchStr
    ) {
      throw new Error(`Semantic version contains non-integer value: ${semVer}`)
    }

    if (major < 0 || major > 16) {
      warnings.push(
        `Major version ${major} is out of range for semver ${semVer}`,
      )
    }
    if (minor < 0 || minor > 16) {
      warnings.push(
        `Minor version ${minor} is out of range for semver ${semVer}`,
      )
    }
    if (patch < 0 || patch > 255) {
      warnings.push(
        `Patch version ${patch} is out of range for semver ${semVer}`,
      )
    }
  }

  return warnings.length > 0 ? warnings : null
}

function getProcessAlarmType(byte: number):
  | {
    sense: 0 | 1
    alarmType: 0 | 1 | 2 | 3 | 4 | 5
  }
  | OutputFailure {
  const alarmType = {
    // sense is bit 7
    sense: ((byte & 0b1000_0000) >> 7) as 0 | 1,

    // alarmType is bit 2 to 0
    alarmType: (byte & 0b0000_0111) as 0 | 1 | 2 | 3 | 4 | 5,
  }

  if (![0, 1, 2, 3, 4, 5].includes(alarmType.alarmType)) {
    return createErrorMessage([
      `Invalid alarmType in process alarm: ${alarmType.alarmType}`,
    ])
  }

  return alarmType
}

function getProcessAlarmRelatedValue(
  byte1: number,
  byte2: number,
  channelId: ChannelId,
  alarmType: 0 | 1 | 2 | 3 | 4 | 5,
): number {
  const value = (byte1 << 8) | byte2

  switch (alarmType) {
    case 2:
    case 3:
      return getRealSlopeValue(value, channelId)

    case 0:
    case 1:
    case 4:
    case 5:
      return getRealMeasurementValue(value, channelId)
  }
}

function isValidHexString(hexEncodedString: string): {
  result: boolean
  reason?: string
} {
  if (hexEncodedString.startsWith('0x')) {
    hexEncodedString = hexEncodedString.slice(2)
  }

  if (hexEncodedString.length % 2 !== 0) {
    return {
      result: false,
      reason: 'Hex string length must be even.',
    }
  }

  for (let i = 0; i < hexEncodedString.length; i++) {
    if (!isValidHexCharacter(hexEncodedString[i]!)) {
      return {
        result: false,
        reason: `Invalid hex character found: '${
          hexEncodedString[i]
        }' at position ${i}.`,
      }
    }
  }

  return {
    result: true,
  }
}

function isValidHexCharacter(char: string): boolean {
  if (char.length !== 1) {
    return false
  }

  return '0123456789abcdefABCDEF'.includes(char)
}

function createErrorMessage(newErrors: OutputError[]): OutputFailure {
  return {
    errors: newErrors.map(error => `${DEVICE_NAME} (JS): ${error}`),
  }
}

function addWarningMessages(
  existingWarnings: OutputWarning[],
  newWarnings: OutputWarning[],
): void {
  newWarnings.forEach((warning) => {
    existingWarnings.push(`${DEVICE_NAME} (JS): ${warning}`)
  })
}

function createChannelData(
  channelId: ChannelId,
  value: number,
): MeasurementChannelEntry {
  return {
    channelId,
    value: getRealMeasurementValue(value, channelId),
  }
}

function getMeasurementRanges(channelId: ChannelId): {
  start: number
  end: number
} {
  switch (channelId) {
    case 0:
      return { start: CHANNEL0_RANGE_START, end: CHANNEL0_RANGE_END }
    case 1:
      return { start: CHANNEL1_RANGE_START, end: CHANNEL1_RANGE_END }
    case 2:
      return { start: CHANNEL2_RANGE_START, end: CHANNEL2_RANGE_END }
    case 3:
      return { start: CHANNEL3_RANGE_START, end: CHANNEL3_RANGE_END }
    case 4:
      return { start: CHANNEL4_RANGE_START, end: CHANNEL4_RANGE_END }
    case 5:
      return { start: CHANNEL5_RANGE_START, end: CHANNEL5_RANGE_END }
  }
}

function getRealMeasurementValue(value: number, channelId: ChannelId): number {
  const { start, end } = getMeasurementRanges(channelId)
  const span = end - start
  const realVal = ((value - 2_500) / 10_000) * span + start
  const roundedVal = Math.round(realVal * 1000) / 1000
  return roundedVal
}

function getRealSlopeValue(value: number, channelId: ChannelId): number {
  const { start, end } = getMeasurementRanges(channelId)
  const span = end - start
  const realVal = (value / 10_000) * span
  const roundedVal = Math.round(realVal * 1000) / 1000
  return roundedVal
}

function getMainConfigurationData(input: Input): {
  data: MainConfigurationData
  warnings?: OutputWarning[]
} {
  const warnings: OutputWarning[] = []

  // byte 4-7
  const acquisitionTimeAlarmsOffValue = (input.bytes[4]! << 24)
    | (input.bytes[5]! << 16) | (input.bytes[6]! << 8) | input.bytes[7]!
  // byte 8-9
  const publicationTimeFactorAlarmsOffValue = (input.bytes[8]! << 8)
    | input.bytes[9]!
  // byte 10-13
  const acquisitionTimeAlarmsOnValue = (input.bytes[10]! << 24)
    | (input.bytes[11]! << 16) | (input.bytes[12]! << 8) | input.bytes[13]!
  // byte 14-15
  const publicationTimeFactorAlarmsOnValue = (input.bytes[14]! << 8)
    | input.bytes[15]!
  // byte 16 unused

  if (
    acquisitionTimeAlarmsOffValue !== 0
    && acquisitionTimeAlarmsOffValue % publicationTimeFactorAlarmsOffValue !== 0
  ) {
    addWarningMessages(warnings, [
      'Acquisition time alarms off must be a multiple of publication time factor alarms off',
    ])
  }
  if (
    acquisitionTimeAlarmsOnValue !== 0
    && acquisitionTimeAlarmsOnValue % publicationTimeFactorAlarmsOnValue !== 0
  ) {
    addWarningMessages(warnings, [
      'Acquisition time alarms on must be a multiple of publication time factor alarms on',
    ])
  }

  const res: {
    data: MainConfigurationData
    warnings?: OutputWarning[]
  } = {
    data: {
      acquisitionTimeAlarmsOff: acquisitionTimeAlarmsOffValue === 0
        ? 'unauthorized'
        : acquisitionTimeAlarmsOffValue,
      publicationTimeFactorAlarmsOff: publicationTimeFactorAlarmsOffValue === 0
        ? 'unauthorized'
        : publicationTimeFactorAlarmsOffValue,
      acquisitionTimeAlarmsOn: acquisitionTimeAlarmsOnValue === 0
        ? 'unauthorized'
        : acquisitionTimeAlarmsOnValue,
      publicationTimeFactorAlarmsOn: publicationTimeFactorAlarmsOnValue === 0
        ? 'unauthorized'
        : publicationTimeFactorAlarmsOnValue,
    },
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

function getChannelConfigurationData(input: Input): {
  data: ChannelConfigurationData
  warnings?: OutputWarning[]
} {
  const warnings: OutputWarning[] = []
  // byte 4
  const sensorOrChannelId = input.bytes[4]!

  // valid ids here are 0 - 5
  if (![0, 1, 2, 3, 4, 5].includes(sensorOrChannelId)) {
    addWarningMessages(warnings, ['Invalid sensor or channel id'])
  }

  // byte 5-6
  const deadBandValue = (input.bytes[5]! << 8) | input.bytes[6]!

  // byte 7 is alarmBitMap
  const alarmBitMap = input.bytes[7]!
  // if bit 0 or 1 is set add warning as those are reserved
  if (alarmBitMap & 0b0000_0011) {
    addWarningMessages(warnings, ['Reserved alarm flags 0 and/or 1 are set'])
  }

  const alarms = {
    isAlarm1Enabled: !!(alarmBitMap & 0b1000_0000),
    isAlarm2Enabled: !!(alarmBitMap & 0b0100_0000),
    isAlarm3Enabled: !!(alarmBitMap & 0b0010_0000),
    isAlarm4Enabled: !!(alarmBitMap & 0b0001_0000),
    isAlarm5Enabled: !!(alarmBitMap & 0b0000_1000),
    isAlarm6Enabled: !!(alarmBitMap & 0b0000_0100),
  }

  // the values are now in the 8th bit onward but only for the enabled alarms (e.g. 3 2-byte pairs for alarm1, alarm3, and alarm4)
  const alarmValues = []
  for (let i = 8; i < input.bytes.length; i += 2) {
    alarmValues.push((input.bytes[i]! << 8) | input.bytes[i + 1]!)
  }

  const data: ChannelConfigurationData = {
    sensorOrChannelId,
    deadBand: deadBandValue,
  }

  let alarmIndex = 0
  if (alarms.isAlarm1Enabled) {
    data.alarm1Threshold = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm2Enabled) {
    data.alarm2Threshold = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm3Enabled) {
    data.alarm3Slope = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm4Enabled) {
    data.alarm4Slope = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm5Enabled) {
    data.alarm5Threshold = alarmValues[alarmIndex++]
    data.alarm5Period = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm6Enabled) {
    data.alarm6Threshold = alarmValues[alarmIndex++]
    data.alarm6Period = alarmValues[alarmIndex++]
  }

  const result: {
    data: ChannelConfigurationData
    warnings?: OutputWarning[]
  } = {
    data,
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

function convertHexStringToBytes(
  hexEncodedString: string,
): number[] | OutputFailure {
  if (hexEncodedString.startsWith('0x')) {
    hexEncodedString = hexEncodedString.slice(2)
  }

  // Remove spaces
  hexEncodedString = hexEncodedString.replace(' ', '')

  const bytes: number[] = []

  for (let i = 0; i < hexEncodedString.length; i += 2) {
    const char1 = hexEncodedString[i]!
    const char2 = hexEncodedString[i + 1]!

    if (!isValidHexCharacter(char1) || !isValidHexCharacter(char2)) {
      return createErrorMessage([
        `Invalid hex character: ${char1}${char2} at position ${i}${i + 1}`,
      ])
    }

    const byte = Number.parseInt(char1 + char2, 16)
    bytes.push(byte)
  }

  return bytes
}
function convertBase64StringToBytes(base64EncodedString: string): number[] {
  // eslint-disable-next-line node/prefer-global/buffer
  const decodedBytes = Buffer.from(base64EncodedString, 'base64')
  const bytes: number[] = []
  decodedBytes.forEach(byte => bytes.push(byte))
  return bytes
}

function getFloat32FromBytes(bytes: number[], startIndex: number): number {
  const b0 = bytes[startIndex]!
  const b1 = bytes[startIndex + 1]!
  const b2 = bytes[startIndex + 2]!
  const b3 = bytes[startIndex + 3]!

  const sign = b0 & 0x80 ? -1 : 1
  const exponent = ((b0 & 0x7F) << 1) | (b1 >> 7)
  const mantissa = ((b1 & 0x7F) << 16) | (b2 << 8) | b3

  if (exponent === 0) {
    return sign * mantissa * 2 ** (-126 - 23)
  }
  else if (exponent === 0xFF) {
    return mantissa ? Number.NaN : sign * Infinity
  }
  else {
    return sign * (1 + mantissa * 2 ** -23) * 2 ** (exponent - 127)
  }
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && value === Math.floor(value)
}

function setMeasurementRanges(ranges: { start: number, end: number }[]): void {
  if (ranges.length > 0) {
    CHANNEL0_RANGE_START = ranges[0]!.start
    CHANNEL0_RANGE_END = ranges[0]!.end
  }
  if (ranges.length > 1) {
    CHANNEL1_RANGE_START = ranges[1]!.start
    CHANNEL1_RANGE_END = ranges[1]!.end
  }
  if (ranges.length > 2) {
    CHANNEL2_RANGE_START = ranges[2]!.start
    CHANNEL2_RANGE_END = ranges[2]!.end
  }
  if (ranges.length > 3) {
    CHANNEL3_RANGE_START = ranges[3]!.start
    CHANNEL3_RANGE_END = ranges[3]!.end
  }
  if (ranges.length > 4) {
    CHANNEL4_RANGE_START = ranges[4]!.start
    CHANNEL4_RANGE_END = ranges[4]!.end
  }
  if (ranges.length > 5) {
    CHANNEL5_RANGE_START = ranges[5]!.start
    CHANNEL5_RANGE_END = ranges[5]!.end
  }
}

// ***********************************************************************************
//          Export functions Section
// ***********************************************************************************
if (typeof exports !== 'undefined') {
  exports.decodeUplink = decodeUplink
  exports.decodeHexString = decodeHexString
  exports.decodeBase64String = decodeBase64String
  // for testing
  exports.setMeasurementRanges = setMeasurementRanges
}

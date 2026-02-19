import type { EncoderFactory, Handler, MultipleEncoderFactory } from '../../../../codecs/tulip2'
import type {
  TGUTULIP2DataMessageData,
  TGUTULIP2DataMessageUplinkOutput,
  TGUTULIP2DeviceAlarmsData,
  TGUTULIP2DeviceAlarmsUplinkOutput,
  TGUTULIP2DeviceInformationData,
  TGUTULIP2DeviceInformationUplinkOutput,
  TGUTULIP2DeviceStatisticsData,
  TGUTULIP2DeviceStatisticsUplinkOutput,
  TGUTULIP2ExtendedDeviceInformationData,
  TGUTULIP2ExtendedDeviceInformationUplinkOutput,
  TGUTULIP2ProcessAlarmsData,
  TGUTULIP2ProcessAlarmsUplinkOutput,
  TGUTULIP2TechnicalAlarmsData,
  TGUTULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import type { TGUTulip2DownlinkInput } from './constants'
import { TGU_NETRIS3_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { validateTULIP2DownlinkInput } from '../../../../schemas/tulip2/downlink'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createTULIP2TGUChannels, TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL, TGUTULIP2_TEMPERATURE_CHANNEL } from './channels'
import { TGU_DOWNLINK_FEATURE_FLAGS, TGU_DOWNLINK_SPAN_LIMIT_FACTORS } from './constants'
import { TGUTULIP2EncodeHandler } from './encode'
import {
  ALARM_EVENTS,
  DEVICE_ALARM_STATUS_TYPES,
  LPP_MEASURANDS_TEMPERATURE,
  LPP_UNITS_TEMPERATURE,
  PROCESS_ALARM_TYPES,
  PRODUCT_SUB_ID_NAMES,
  TECHNICAL_ALARM_TYPES,
  TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE,
} from './lookups'

const ERROR_VALUE = 0xFFFF

type TULIP2TGUChannels = ReturnType<typeof createTULIP2TGUChannels>

type TechnicalAlarmTypeId = (typeof TECHNICAL_ALARM_TYPES)[keyof typeof TECHNICAL_ALARM_TYPES]
type TechnicalCauseOfFailureName = (typeof TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE)[keyof typeof TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE][number]['name']

// Temperature channel types (used for both channels)
type TemperatureMeasurandId = keyof typeof LPP_MEASURANDS_TEMPERATURE
type TemperatureMeasurandName = (typeof LPP_MEASURANDS_TEMPERATURE)[TemperatureMeasurandId]
type TemperatureUnitId = keyof typeof LPP_UNITS_TEMPERATURE
type TemperatureUnitName = (typeof LPP_UNITS_TEMPERATURE)[TemperatureUnitId]

function resolveCauseOfFailureName(alarmType: number, causeOfFailure: number): TechnicalCauseOfFailureName {
  const entries = TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE[alarmType as TechnicalAlarmTypeId]
  if (!entries) {
    throw new Error(`Unknown technical alarm type ${alarmType} in technical alarm message`)
  }

  const match = entries.find(entry => (causeOfFailure & entry.mask) !== 0)
  if (!match) {
    throw new Error(`Unknown causeOfFailure ${causeOfFailure} for technical alarm type ${alarmType} in technical alarm message`)
  }

  return match.name
}

function findChannel(
  channels: TULIP2TGUChannels,
  channelId: typeof TGUTULIP2_TEMPERATURE_CHANNEL.channelId,
): Extract<TULIP2TGUChannels[number], { channelId: typeof TGUTULIP2_TEMPERATURE_CHANNEL.channelId }>
function findChannel(
  channels: TULIP2TGUChannels,
  channelId: typeof TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId,
): Extract<TULIP2TGUChannels[number], { channelId: typeof TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId }>
function findChannel(
  channels: TULIP2TGUChannels,
  channelId: number,
): TULIP2TGUChannels[number]
function findChannel(channels: TULIP2TGUChannels, channelId: number): TULIP2TGUChannels[number] {
  const channel = channels.find(candidate => candidate.channelId === channelId)
  if (!channel) {
    throw new Error(`Channel configuration missing for channelId ${channelId} in data message`)
  }
  return channel
}

const handleDataMessage: Handler<TULIP2TGUChannels, TGUTULIP2DataMessageUplinkOutput> = (input, options) => {
  const length = input.bytes.length
  if (length !== 5 && length !== 7) {
    throw new Error(`Data message (0x01/0x02) requires 5 or 7 bytes, but received ${length} bytes`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!
  const channel0 = findChannel(options.channels, TGUTULIP2_TEMPERATURE_CHANNEL.channelId)
  const channel1 = findChannel(options.channels, TGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId)

  const channels: TGUTULIP2DataMessageData['channels'][number][] = []
  const warnings: string[] = []

  const rawChannel0 = (input.bytes[3]! << 8) | input.bytes[4]!
  if (rawChannel0 === ERROR_VALUE) {
    throw new Error('Invalid data for channel - temperature : 0xffff, 65535')
  }
  else {
    channels.push({
      channelId: channel0.channelId,
      channelName: channel0.name,
      value: roundValue(TULIPValueToValue(rawChannel0, channel0), options.roundingDecimals),
    })
  }

  if (length === 5) {
    warnings.push('Not enough data to decode channel (channel 1). Payload must has a length of 4 bytes, input data length: 5')
  }
  else {
    const rawChannel1 = (input.bytes[5]! << 8) | input.bytes[6]!
    if (rawChannel1 === ERROR_VALUE) {
      throw new Error('Invalid data for channel - device temperature : 0xffff, 65535')
    }
    else {
      channels.push({
        channelId: channel1.channelId,
        channelName: channel1.name,
        value: roundValue(TULIPValueToValue(rawChannel1, channel1), options.roundingDecimals),
      })
    }
  }

  const result: TGUTULIP2DataMessageUplinkOutput = {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleProcessAlarmMessage: Handler<TULIP2TGUChannels, TGUTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 6 || (input.bytes.length - 3) % 3 !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 6 bytes (and target byte count 3n+3), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: TGUTULIP2ProcessAlarmsData = []
  const warnings: string[] = []

  for (let byteIndex = 3; byteIndex < input.bytes.length; byteIndex += 3) {
    const header = input.bytes[byteIndex]!
    const channelId = (header & 0x78) >> 3
    const alarmType = header & 0x07
    const event = (header & 0x80) >> 7
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!

    const channel = findChannel(options.channels, channelId)

    let value: number
    if (rawValue === ERROR_VALUE) {
      value = ERROR_VALUE
    }
    else if (alarmType === PROCESS_ALARM_TYPES['falling slope'] || alarmType === PROCESS_ALARM_TYPES['rising slope']) {
      value = roundValue(slopeValueToValue(rawValue, channel), options.roundingDecimals)
    }
    else {
      value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)
    }

    const alarmTypeName = (Object.entries(PROCESS_ALARM_TYPES).find(([, id]) => id === alarmType)?.[0]) as (keyof typeof PROCESS_ALARM_TYPES) | undefined
    if (!alarmTypeName) {
      throw new Error(`Unknown alarmType ${alarmType} in process alarm message`)
    }

    const eventName = (Object.entries(ALARM_EVENTS).find(([, id]) => id === event)?.[0]) as (keyof typeof ALARM_EVENTS) | undefined
    if (!eventName) {
      throw new Error(`Unknown event ${event} in process alarm message`)
    }

    processAlarms.push({
      channelId,
      channelName: channel.name,
      alarmType,
      alarmTypeName,
      event,
      eventName,
      value,
    } as TGUTULIP2ProcessAlarmsData[number])

    if (value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${String(channel.name)}channel`)
    }
  }

  const result: TGUTULIP2ProcessAlarmsUplinkOutput = {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleTechnicalAlarmMessage: Handler<TULIP2TGUChannels, TGUTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length < 6 || (input.bytes.length - 3) % 3 !== 0) {
    throw new Error(`Technical alarm message (0x04) requires at least 6 bytes (and target byte count 3n+3), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const technicalAlarms: TGUTULIP2TechnicalAlarmsData = []

  for (let byteIndex = 3; byteIndex < input.bytes.length; byteIndex += 3) {
    const alarmType = input.bytes[byteIndex]!
    const alarmTypeNameEntry = Object.entries(TECHNICAL_ALARM_TYPES).find(([, id]) => id === alarmType)
    if (!alarmTypeNameEntry) {
      throw new Error(`Unknown technical alarm type ${alarmType} in technical alarm message`)
    }
    const alarmTypeName = alarmTypeNameEntry[0] as keyof typeof TECHNICAL_ALARM_TYPES
    const causeOfFailure = input.bytes[byteIndex + 2]!

    const causeOfFailureName = resolveCauseOfFailureName(alarmType, causeOfFailure)

    technicalAlarms.push({
      alarmType,
      alarmTypeName,
      causeOfFailure,
      causeOfFailureName,
    } as TGUTULIP2TechnicalAlarmsData[number])
  }

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2TGUChannels, TGUTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm message (0x05) requires 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const alarmStatus = ((input.bytes[2]! << 8) | input.bytes[3]!) >>> 0
  const alarmStatusNames: TGUTULIP2DeviceAlarmsData['alarmStatusNames'] = []

  for (let bitIndex = 0, nameIndex = 0; bitIndex < 15; bitIndex += 1) {
    const mask = 1 << bitIndex
    if ((alarmStatus & mask) !== 0) {
      const name = Object.entries(DEVICE_ALARM_STATUS_TYPES).find(([, value]) => value === mask)?.[0]
      if (name) {
        alarmStatusNames[nameIndex] = name as keyof typeof DEVICE_ALARM_STATUS_TYPES
        nameIndex += 1
      }
    }
  }

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm: {
        alarmStatus,
        alarmStatusNames,
      },
    },
  }
}

function resolveProductSubId(productSubId: number): { id: 0, name: 'LoRaWAN' } {
  if (productSubId !== PRODUCT_SUB_ID_NAMES.LoRaWAN) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message. Only LoRaWAN (0) is supported.`)
  }
  return { id: 0 as const, name: 'LoRaWAN' as const }
}

function resolveTemperatureMeasurand(measurand: number): { id: TemperatureMeasurandId, name: TemperatureMeasurandName } {
  const name = LPP_MEASURANDS_TEMPERATURE[measurand as TemperatureMeasurandId]
  if (!name) {
    throw new Error(`Unknown temperature measurand ${measurand} in device identification message`)
  }
  return {
    id: measurand as TemperatureMeasurandId,
    name,
  }
}

function resolveTemperatureUnit(unit: number): { id: TemperatureUnitId, name: TemperatureUnitName } {
  const name = LPP_UNITS_TEMPERATURE[unit as TemperatureUnitId]
  if (!name) {
    throw new Error(`Unknown temperature unit ${unit} in device identification message`)
  }
  return {
    id: unit as TemperatureUnitId,
    name,
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2TGUChannels, TGUTULIP2DeviceInformationUplinkOutput> = (input, options) => {
  if (input.bytes.length !== 26) {
    throw new Error(`Device identification message (0x07) requires 26 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = 0x07
  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!

  if (productId !== 0x0F) {
    throw new Error(`Invalid productId ${productId} in device identification message. Expected 15 (NETRIS3).`)
  }

  const { id: productSubId, name: productSubIdName } = resolveProductSubId(input.bytes[3]!)
  const sensorDeviceTypeId = (input.bytes[4]! << 8) | input.bytes[5]!

  // Channel 0 (temperature)
  const channel0Measurand = resolveTemperatureMeasurand(input.bytes[6]!)
  const channel0RangeStart = intTuple4ToFloat32WithThreshold([
    input.bytes[7]!,
    input.bytes[8]!,
    input.bytes[9]!,
    input.bytes[10]!,
  ])
  const channel0RangeEnd = intTuple4ToFloat32WithThreshold([
    input.bytes[11]!,
    input.bytes[12]!,
    input.bytes[13]!,
    input.bytes[14]!,
  ])
  const channel0Unit = resolveTemperatureUnit(input.bytes[15]!)

  // Channel 1 (device temperature)
  const channel1Measurand = resolveTemperatureMeasurand(input.bytes[16]!)
  const channel1RangeStart = intTuple4ToFloat32WithThreshold([
    input.bytes[17]!,
    input.bytes[18]!,
    input.bytes[19]!,
    input.bytes[20]!,
  ])
  const channel1RangeEnd = intTuple4ToFloat32WithThreshold([
    input.bytes[21]!,
    input.bytes[22]!,
    input.bytes[23]!,
    input.bytes[24]!,
  ])
  const channel1Unit = resolveTemperatureUnit(input.bytes[25]!)

  const channelConfigurations: TGUTULIP2DeviceInformationData['channelConfigurations'] = [
    {
      channelId: options.channels[0].channelId,
      channelName: options.channels[0].name,
      measurand: channel0Measurand.id,
      measurandName: channel0Measurand.name,
      measurementRangeStart: channel0RangeStart,
      measurementRangeEnd: channel0RangeEnd,
      unit: channel0Unit.id,
      unitName: channel0Unit.name,
    },
    {
      channelId: options.channels[1].channelId,
      channelName: options.channels[1].name,
      measurand: channel1Measurand.id,
      measurandName: channel1Measurand.name,
      measurementRangeStart: channel1RangeStart,
      measurementRangeEnd: channel1RangeEnd,
      unit: channel1Unit.id,
      unitName: channel1Unit.name,
    },
  ]

  return {
    data: {
      messageType,
      configurationId,
      deviceInformation: {
        productId: 0x0F as const,
        productIdName: 'NETRIS3' as const,
        productSubId,
        productSubIdName,
        sensorDeviceTypeId,
        channelConfigurations,
      },
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2TGUChannels, TGUTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 10) {
    throw new Error(`Keep alive message (0x08) requires 10 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const numberOfMeasurements = (((input.bytes[2]! << 24) >>> 0) + ((input.bytes[3]! << 16) >>> 0) + ((input.bytes[4]! << 8) >>> 0) + input.bytes[5]!) >>> 0
  const numberOfTransmissions = (((input.bytes[6]! << 24) >>> 0) + ((input.bytes[7]! << 16) >>> 0) + ((input.bytes[8]! << 8) >>> 0) + input.bytes[9]!) >>> 0

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        numberOfMeasurements,
        numberOfTransmissions,
      } as TGUTULIP2DeviceStatisticsData,
    },
  }
}

const handleExtendedDeviceIdentificationMessage: Handler<TULIP2TGUChannels, TGUTULIP2ExtendedDeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length !== 42) {
    throw new Error(`Extended device identification message (0x09) requires 42 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const optionalFieldsMask = input.bytes[2]! & 0x0F
  let position = 3

  const deviceInformation: TGUTULIP2ExtendedDeviceInformationData = {
    optionalFieldsMask,
    deviceHardwareVersion: '',
    deviceSerialNumber: '',
    deviceProductCode: '',
    deviceFirmwareVersion: '',
  }

  if ((optionalFieldsMask & 0x01) !== 0) {
    let serial = ''
    for (let index = position; index < position + 12; index += 1) {
      const char = input.bytes[index]!
      if (char === 0) {
        break
      }
      serial += String.fromCharCode(char)
    }
    if (serial.length > 0) {
      deviceInformation.wikaSensorSerialNumber = serial
    }
    position += 12
  }

  if ((optionalFieldsMask & 0x02) !== 0) {
    const sensorLUID = (((input.bytes[position]! << 24) >>> 0) + ((input.bytes[position + 1]! << 16) >>> 0) + ((input.bytes[position + 2]! << 8) >>> 0) + input.bytes[position + 3]!) >>> 0
    deviceInformation.sensorLUID = sensorLUID
    position += 4
  }

  if ((optionalFieldsMask & 0x04) !== 0) {
    deviceInformation.sensorHardwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`
    position += 3
  }

  deviceInformation.deviceHardwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`
  position += 3

  if ((optionalFieldsMask & 0x08) !== 0) {
    deviceInformation.sensorFirmwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`
    position += 3
  }

  const digitSerialNumber = (input.bytes[position]! << 16) | (input.bytes[position + 1]! << 8) | input.bytes[position + 2]!
  const letterSerialNumber = String.fromCharCode(input.bytes[position + 3]!)
  deviceInformation.deviceSerialNumber = `${letterSerialNumber}${digitSerialNumber.toString().padStart(6, '0')}`
  position += 4

  deviceInformation.deviceProductCode = String.fromCharCode(
    input.bytes[position]!,
    input.bytes[position + 1]!,
    input.bytes[position + 2]!,
    input.bytes[position + 3]!,
    input.bytes[position + 4]!,
    input.bytes[position + 5]!,
    input.bytes[position + 6]!,
  )
  position += 7

  deviceInformation.deviceFirmwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`

  return {
    data: {
      messageType: 0x09,
      configurationId,
      extendedDeviceInformation: deviceInformation,
    },
  }
}

const tguEncoderFactory: EncoderFactory<TGUTulip2DownlinkInput> = (options) => {
  const featureFlags = TGU_DOWNLINK_FEATURE_FLAGS
  return (input: TGUTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, undefined, TGU_DOWNLINK_SPAN_LIMIT_FACTORS)
    return TGUTULIP2EncodeHandler(validated as TGUTulip2DownlinkInput)
  }
}

const tguMultipleEncodeFactory: MultipleEncoderFactory<TGUTulip2DownlinkInput> = (options) => {
  const featureFlags = TGU_DOWNLINK_FEATURE_FLAGS
  return (input: TGUTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, undefined, TGU_DOWNLINK_SPAN_LIMIT_FACTORS)
    return TGUTULIP2EncodeHandler(validated as TGUTulip2DownlinkInput, true)
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTGUTULIP2Codec() {
  return defineTULIP2Codec({
    deviceName: TGU_NETRIS3_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2TGUChannels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
      0x09: handleExtendedDeviceIdentificationMessage,
    },
    encoderFactory: tguEncoderFactory,
    multipleEncodeFactory: tguMultipleEncodeFactory,
  })
}

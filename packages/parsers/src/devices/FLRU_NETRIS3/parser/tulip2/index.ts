import type { EncoderFactory, Handler, MultipleEncoderFactory } from '../../../../codecs/tulip2'
import type {
  FLRUTULIP2DataMessageUplinkOutput,
  FLRUTULIP2DeviceAlarmsData,
  FLRUTULIP2DeviceAlarmsUplinkOutput,
  FLRUTULIP2DeviceInformationData,
  FLRUTULIP2DeviceInformationUplinkOutput,
  FLRUTULIP2DeviceStatisticsData,
  FLRUTULIP2DeviceStatisticsUplinkOutput,
  FLRUTULIP2ExtendedDeviceInformationData,
  FLRUTULIP2ExtendedDeviceInformationUplinkOutput,
  FLRUTULIP2ProcessAlarmsData,
  FLRUTULIP2ProcessAlarmsUplinkOutput,
  FLRUTULIP2TechnicalAlarmsData,
  FLRUTULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import type { FLRUTulip2DownlinkInput } from './constants'
import { FLRU_NETRIS3_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { validateTULIP2DownlinkInput } from '../../../../schemas/tulip2/downlink'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createTULIP2FLRUChannels } from './channels'
import { FLRU_DOWNLINK_FEATURE_FLAGS, FLRU_DOWNLINK_SPAN_LIMIT_FACTORS } from './constants'
import { FLRUTULIP2EncodeHandler } from './encode'
import {
  ALARM_EVENTS,
  DEVICE_ALARM_STATUS_TYPES,
  LPP_MEASURANDS_BY_ID,
  LPP_UNITS_BY_ID,
  PROCESS_ALARM_TYPES,
  PRODUCT_SUB_ID_NAMES,
  TECHNICAL_ALARM_TYPES,
  TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE,
} from './lookups'

const ERROR_VALUE = 0xFFFF

type TULIP2FLRUChannels = ReturnType<typeof createTULIP2FLRUChannels>

type TechnicalAlarmTypeId = (typeof TECHNICAL_ALARM_TYPES)[keyof typeof TECHNICAL_ALARM_TYPES]
type TechnicalCauseOfFailureName = (typeof TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE)[keyof typeof TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE][number]['name']

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

const handleDataMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length < 5 || input.bytes.length > 11) {
    throw new Error(`Data message (0x01/0x02) requires at least 5 and at most 11 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!
  const channel = options.channels[0]

  const rawValue = (input.bytes[3]! << 8) | input.bytes[4]!
  if (rawValue === ERROR_VALUE) {
    throw new Error('Invalid data for channel - level : 0xffff, 65535')
  }

  const value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)

  return {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels: [
          {
            channelId: channel.channelId,
            channelName: channel.name,
            value,
          },
        ],
      },
    },
  }
}

const handleProcessAlarmMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 6 || (input.bytes.length - 3) % 3 !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 6 bytes (and target byte count 3n+3), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: FLRUTULIP2ProcessAlarmsData = []
  const warnings: string[] = []

  for (let byteIndex = 3; byteIndex < input.bytes.length; byteIndex += 3) {
    const header = input.bytes[byteIndex]!
    const channelId = (header & 0x78) >> 3
    const alarmType = header & 0x07
    const event = (header & 0x80) >> 7
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!

    const channel = options.channels.find((candidate): candidate is TULIP2FLRUChannels[number] => candidate.channelId === channelId)
    if (!channel) {
      throw new Error(`Channel configuration missing for channelId ${channelId} in process alarm message`)
    }
    const channelName = channel.name

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
    const eventName = (Object.entries(ALARM_EVENTS).find(([, id]) => id === event)?.[0]) as (keyof typeof ALARM_EVENTS) | undefined

    if (!alarmTypeName) {
      throw new Error(`Unknown alarmType ${alarmType} in process alarm message`)
    }
    if (!eventName) {
      throw new Error(`Unknown event ${event} in process alarm message`)
    }

    processAlarms.push({
      channelId,
      channelName,
      event,
      eventName,
      alarmType,
      alarmTypeName,
      value,
    } as FLRUTULIP2ProcessAlarmsData[number])

    if (value === ERROR_VALUE) {
      warnings.push((`Invalid data for ${String(channelName)}channel`))
    }
  }

  const result: FLRUTULIP2ProcessAlarmsUplinkOutput = {
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

const handleTechnicalAlarmMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length < 6 || (input.bytes.length - 3) % 3 !== 0) {
    throw new Error(`Technical alarm message (0x04) requires at least 6 bytes (and target byte count 3n+3), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const technicalAlarms: FLRUTULIP2TechnicalAlarmsData = []

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
    } as FLRUTULIP2TechnicalAlarmsData[number])
  }

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm message (0x05) requires 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const alarmStatus = ((input.bytes[2]! << 8) | input.bytes[3]!) >>> 0
  const alarmStatusNames: FLRUTULIP2DeviceAlarmsData['alarmStatusNames'] = []

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

function resolveProductSubIdName(productSubId: number): keyof typeof PRODUCT_SUB_ID_NAMES {
  const entry = Object.entries(PRODUCT_SUB_ID_NAMES).find(([, value]) => value === productSubId)
  if (!entry) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message. Only LoRaWAN (0) is supported.`)
  }
  return entry[0] as keyof typeof PRODUCT_SUB_ID_NAMES
}

function resolveMeasurandName(id: number): (typeof LPP_MEASURANDS_BY_ID)[keyof typeof LPP_MEASURANDS_BY_ID] {
  const name = LPP_MEASURANDS_BY_ID[id as keyof typeof LPP_MEASURANDS_BY_ID]
  if (!name) {
    throw new Error(`Unknown measurand ${id} in device identification message`)
  }
  return name
}

function resolveUnitName(id: number): (typeof LPP_UNITS_BY_ID)[keyof typeof LPP_UNITS_BY_ID] {
  const name = LPP_UNITS_BY_ID[id as keyof typeof LPP_UNITS_BY_ID]
  if (!name) {
    throw new Error(`Unknown unit ${id} in device identification message`)
  }
  return name
}

const handleDeviceIdentificationMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2DeviceInformationUplinkOutput> = (input, options) => {
  if (input.bytes.length < 16 || input.bytes.length > 56) {
    throw new Error(`Device identification message (0x07) requires at least 16 and at most 56 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = 0x07
  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  const productIdName = productId === 15 ? 'NETRIS3' : productId
  const productSubId = input.bytes[3]!
  const productSubIdName = resolveProductSubIdName(productSubId)
  const sensorDeviceTypeId = (input.bytes[4]! << 8) | input.bytes[5]!

  const measurand = input.bytes[6]!
  const measurandName = resolveMeasurandName(measurand)

  const measurementRangeStart = intTuple4ToFloat32WithThreshold([
    input.bytes[7]!,
    input.bytes[8]!,
    input.bytes[9]!,
    input.bytes[10]!,
  ])

  const measurementRangeEnd = intTuple4ToFloat32WithThreshold([
    input.bytes[11]!,
    input.bytes[12]!,
    input.bytes[13]!,
    input.bytes[14]!,
  ])

  const unit = input.bytes[15]!
  const unitName = resolveUnitName(unit)

  return {
    data: {
      messageType,
      configurationId,
      deviceInformation: {
        productId,
        productIdName,
        productSubId,
        productSubIdName,
        sensorDeviceTypeId,
        channelConfigurations: [
          {
            channelId: options.channels[0].channelId,
            channelName: options.channels[0].name,
            measurand,
            measurandName,
            measurementRangeStart,
            measurementRangeEnd,
            unit,
            unitName,
          },
        ],
      } as FLRUTULIP2DeviceInformationData,
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2DeviceStatisticsUplinkOutput> = (input) => {
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
      } as FLRUTULIP2DeviceStatisticsData,
    },
  }
}

const handleExtendedDeviceIdentificationMessage: Handler<TULIP2FLRUChannels, FLRUTULIP2ExtendedDeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length < 20 || input.bytes.length > 42) {
    throw new Error(`Extended device identification message (0x09) requires at least 20 and at most 42 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const optionalFieldsMask = input.bytes[2]! & 0x0F
  let position = 3

  const deviceInformation: FLRUTULIP2ExtendedDeviceInformationData = {
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

const flruEncoderFactory: EncoderFactory<FLRUTulip2DownlinkInput> = (options) => {
  const featureFlags = FLRU_DOWNLINK_FEATURE_FLAGS
  return (input: FLRUTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, undefined, FLRU_DOWNLINK_SPAN_LIMIT_FACTORS)
    return FLRUTULIP2EncodeHandler(validated as FLRUTulip2DownlinkInput)
  }
}

const flruMultipleEncodeFactory: MultipleEncoderFactory<FLRUTulip2DownlinkInput> = (options) => {
  const featureFlags = FLRU_DOWNLINK_FEATURE_FLAGS
  return (input: FLRUTulip2DownlinkInput) => {
    const channels = options.getChannels()
    const validated = validateTULIP2DownlinkInput(input, channels, featureFlags, undefined, FLRU_DOWNLINK_SPAN_LIMIT_FACTORS)
    return FLRUTULIP2EncodeHandler(validated as FLRUTulip2DownlinkInput, true)
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createFLRUTULIP2Codec() {
  return defineTULIP2Codec({
    deviceName: FLRU_NETRIS3_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2FLRUChannels(),
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
    encoderFactory: flruEncoderFactory,
    multipleEncodeFactory: flruMultipleEncodeFactory,
  })
}

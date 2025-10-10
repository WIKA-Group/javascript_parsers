import type { Handler, TULIP2Channel } from '../../../../codecs/tulip2'
import type {
  PGW23_100_11TULIP2DataMessageUplinkOutput,
  PGW23_100_11TULIP2DeviceAlarmsUplinkOutput,
  PGW23_100_11TULIP2DeviceInformationUplinkOutput,
  PGW23_100_11TULIP2DeviceStatisticsUplinkOutput,
  PGW23_100_11TULIP2ProcessAlarmsData,
  PGW23_100_11TULIP2ProcessAlarmsUplinkOutput,
  PGW23_100_11TULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import { PGW23_100_11_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import {
  ALARM_EVENTS,
  DEVICE_ALARM_CAUSE_OF_FAILURE,
  DEVICE_ALARM_TYPES,
  MEASUREMENT_CHANNELS,
  PRESSURE_TYPES,
  PRESSURE_UNITS,
  PROCESS_ALARM_TYPES,
  TECHNICAL_ALARM_CAUSE_OF_FAILURE,
  TEMPERATURE_UNITS,
} from './lookups'

const ERROR_VALUE = 0xFFFF

// eslint-disable-next-line ts/explicit-function-return-type
function createTULIP2PGWChannels() {
  return [
    {
      channelId: MEASUREMENT_CHANNELS.pressure,
      name: 'pressure',
      start: 0 as number,
      end: 10 as number,
    },
    {
      channelId: MEASUREMENT_CHANNELS['device temperature'],
      name: 'device temperature',
      start: -40 as number,
      end: 60 as number,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

type TULIP2PGWChannels = ReturnType<typeof createTULIP2PGWChannels>

const handleDataMessage: Handler<TULIP2PGWChannels, PGW23_100_11TULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length !== 7) {
    throw new Error(`Data message 01/02 needs 7 bytes but got ${input.bytes.length}`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!
  const batteryRaw = input.bytes[2]!
  const pressureRaw = (input.bytes[3]! << 8) | input.bytes[4]!
  const temperatureRaw = (input.bytes[5]! << 8) | input.bytes[6]!

  const pressureValue = roundValue(TULIPValueToValue(pressureRaw, options.channels[0]), options.roundingDecimals)
  const temperatureValue = roundValue(TULIPValueToValue(temperatureRaw, options.channels[1]), options.roundingDecimals)
  const batteryValue = batteryRaw / 10

  return {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels: [
          {
            channelId: MEASUREMENT_CHANNELS.pressure,
            channelName: 'pressure',
            value: pressureValue,
          },
          {
            channelId: MEASUREMENT_CHANNELS['device temperature'],
            channelName: 'device temperature',
            value: temperatureValue,
          },
          {
            channelId: MEASUREMENT_CHANNELS['battery voltage'],
            channelName: 'battery voltage',
            value: batteryValue,
          },
        ],
      },
    },
  }
}

const handleProcessAlarmMessage: Handler<TULIP2PGWChannels, PGW23_100_11TULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 5 || ((input.bytes.length - 2) % 3) !== 0) {
    throw new Error(`Process alarm 03 needs at least 5 bytes and got ${input.bytes.length}. Also all bytes for each alarm needed`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: PGW23_100_11TULIP2ProcessAlarmsData = []

  for (let byteIndex = 2; byteIndex < input.bytes.length; byteIndex += 3) {
    const descriptor = input.bytes[byteIndex]!
    const channelId = ((descriptor & 0x78) >> 3) as 0 | 1
    const channel = options.channels.find(c => c.channelId === channelId)
    if (!channel) {
      throw new TypeError(`Unknown channel ID: ${channelId} in process alarm message`)
    }

    const alarmType = descriptor & 0x07
    const event = (descriptor & 0x80) >> 7
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!
    const isSlope = alarmType === PROCESS_ALARM_TYPES['falling slope'] || alarmType === PROCESS_ALARM_TYPES['rising slope']
    const value = roundValue(isSlope ? slopeValueToValue(rawValue, channel) : TULIPValueToValue(rawValue, channel), options.roundingDecimals)

    processAlarms.push({
      channelId,
      channelName: channel.name,
      event,
      eventName: Object.keys(ALARM_EVENTS).find(key => ALARM_EVENTS[key as keyof typeof ALARM_EVENTS] === event)!,
      alarmType,
      alarmTypeName: Object.keys(PROCESS_ALARM_TYPES).find(key => PROCESS_ALARM_TYPES[key as keyof typeof PROCESS_ALARM_TYPES] === alarmType)!,
      value,
    } as PGW23_100_11TULIP2ProcessAlarmsData[number])
  }

  const warnings: string[] = []

  for (const alarm of processAlarms) {
    if (alarm.value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${alarm.channelName}channel`)
    }
  }

  const result: PGW23_100_11TULIP2ProcessAlarmsUplinkOutput = {
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

const handleTechnicalAlarmMessage: Handler<TULIP2PGWChannels, PGW23_100_11TULIP2TechnicalAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 5 || ((input.bytes.length - 2) % 3) !== 0) {
    throw new Error(`Technical alarm 04 needs at least 5 bytes and got ${input.bytes.length}. Also all bytes for each alarm needed`)
  }

  const configurationId = input.bytes[1]!
  const technicalAlarms: PGW23_100_11TULIP2TechnicalAlarmsUplinkOutput['data']['technicalAlarms'] = []
  const warnings: string[] = []

  for (let byteIndex = 2; byteIndex < input.bytes.length; byteIndex += 3) {
    const descriptor = input.bytes[byteIndex]!
    const event = (descriptor & 0x80) >> 7
    const channelId = ((descriptor & 0x78) >> 3) as 0 | 1
    const channel = options.channels.find(c => c.channelId === channelId)
    if (!channel) {
      throw new TypeError(`Unknown channel ID: ${channelId} in technical alarm message`)
    }
    const causeOfFailure = descriptor & 0x07
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!
    const value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)

    if (value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${channel.name}channel`)
    }

    technicalAlarms.push({
      event,
      eventName: Object.keys(ALARM_EVENTS).find(key => ALARM_EVENTS[key as keyof typeof ALARM_EVENTS] === event)!,
      channelId,
      channelName: channel.name,
      causeOfFailure,
      causeOfFailureName: Object.keys(TECHNICAL_ALARM_CAUSE_OF_FAILURE).find(key => TECHNICAL_ALARM_CAUSE_OF_FAILURE[key as keyof typeof TECHNICAL_ALARM_CAUSE_OF_FAILURE] === causeOfFailure) ?? '',
      value,
    })
  }

  const result: PGW23_100_11TULIP2TechnicalAlarmsUplinkOutput = {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleDeviceAlarmMessage: Handler<TULIP2PGWChannels, PGW23_100_11TULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm 05 needs 4 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const descriptor = input.bytes[2]!
  const event = (descriptor & 0x80) >> 7
  const causeOfFailure = (descriptor & 0x60) >> 6
  const alarmType = descriptor & 0x1F
  const raw = input.bytes[3]!
  const value = (raw << 24) >> 24

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm: {
        event,
        eventName: Object.keys(ALARM_EVENTS).find(key => ALARM_EVENTS[key as keyof typeof ALARM_EVENTS] === event)!,
        causeOfFailure,
        causeOfFailureName: Object.keys(DEVICE_ALARM_CAUSE_OF_FAILURE).find(key => DEVICE_ALARM_CAUSE_OF_FAILURE[key as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE] === causeOfFailure) ?? '',
        alarmType,
        alarmTypeName: Object.keys(DEVICE_ALARM_TYPES).find(key => DEVICE_ALARM_TYPES[key as keyof typeof DEVICE_ALARM_TYPES] === alarmType)!,
        value,
      },
    },
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2PGWChannels, PGW23_100_11TULIP2DeviceInformationUplinkOutput> = (input, options) => {
  if (input.bytes.length < 41) {
    throw new Error(`Device identification 07 needs at least 41 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  const productIdName = productId === 10 ? PGW23_100_11_NAME : `${productId}`

  const wirelessModuleFirmwareVersion = `${(input.bytes[3]! >> 4) & 0x0F}.${input.bytes[3]! & 0x0F}.${input.bytes[4]!}`
  const wirelessModuleHardwareVersion = `${(input.bytes[5]! >> 4) & 0x0F}.${input.bytes[5]! & 0x0F}.${input.bytes[6]!}`
  const sensorModuleFirmwareVersion = `${(input.bytes[7]! >> 4) & 0x0F}.${input.bytes[7]! & 0x0F}.${input.bytes[8]!}`
  const sensorModuleHardwareVersion = `${(input.bytes[9]! >> 4) & 0x0F}.${input.bytes[9]! & 0x0F}.${input.bytes[10]!}`

  let serialNumber = ''
  for (let i = 11; i < 22; i++) {
    const byte = input.bytes[i]!
    if (byte === 0) {
      break
    }
    serialNumber += String.fromCharCode(byte)
  }

  const pressureTypeId = input.bytes[22]!
  const pressureTypeEntry = Object.entries(PRESSURE_TYPES).find(([, candidate]) => candidate === pressureTypeId)
  if (!pressureTypeEntry) {
    throw new Error(`Unsupported pressure type: ${pressureTypeId}`)
  }
  const pressureType = pressureTypeEntry[0] as keyof typeof PRESSURE_TYPES

  const measurementRangeStartPressure = roundValue(intTuple4ToFloat32WithThreshold([
    input.bytes[26]!,
    input.bytes[25]!,
    input.bytes[24]!,
    input.bytes[23]!,
  ]), options.roundingDecimals)

  const measurementRangeEndPressure = roundValue(intTuple4ToFloat32WithThreshold([
    input.bytes[30]!,
    input.bytes[29]!,
    input.bytes[28]!,
    input.bytes[27]!,
  ]), options.roundingDecimals)

  const measurementRangeStartDeviceTemperature = roundValue(intTuple4ToFloat32WithThreshold([
    input.bytes[34]!,
    input.bytes[33]!,
    input.bytes[32]!,
    input.bytes[31]!,
  ]), options.roundingDecimals)

  const measurementRangeEndDeviceTemperature = roundValue(intTuple4ToFloat32WithThreshold([
    input.bytes[38]!,
    input.bytes[37]!,
    input.bytes[36]!,
    input.bytes[35]!,
  ]), options.roundingDecimals)

  const pressureUnit = input.bytes[39]!
  const pressureUnitEntry = Object.entries(PRESSURE_UNITS).find(([, candidate]) => candidate === pressureUnit)
  if (!pressureUnitEntry) {
    throw new Error(`Unsupported pressure unit: ${pressureUnit}`)
  }
  const pressureUnitName = pressureUnitEntry[0] as keyof typeof PRESSURE_UNITS
  const deviceTemperatureUnit = input.bytes[40]!
  const deviceTemperatureUnitEntry = Object.entries(TEMPERATURE_UNITS).find(([, candidate]) => candidate === deviceTemperatureUnit)
  if (!deviceTemperatureUnitEntry) {
    throw new Error(`Unsupported device temperature unit: ${deviceTemperatureUnit}`)
  }
  const deviceTemperatureUnitName = deviceTemperatureUnitEntry[0] as keyof typeof TEMPERATURE_UNITS

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productIdName,
        productId,
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        sensorModuleFirmwareVersion,
        sensorModuleHardwareVersion,
        serialNumber,
        pressureType,
        measurementRangeStartPressure,
        measurementRangeEndPressure,
        measurementRangeStartDeviceTemperature,
        measurementRangeEndDeviceTemperature,
        pressureUnit,
        pressureUnitName,
        deviceTemperatureUnit,
        deviceTemperatureUnitName,
      },
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2PGWChannels, PGW23_100_11TULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message 08 needs 3 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const batteryByte = input.bytes[2]!

  const batteryLevelNewEvent = ((batteryByte & 0x80) >> 7) === 1
  const batteryLevelPercent = batteryByte & 0x7F

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent,
        batteryLevelPercent,
      },
    },
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2PGWCodec() {
  return defineTULIP2Codec({
    deviceName: PGW23_100_11_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2PGWChannels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
    },
  })
}

export type {
  TULIP2PGWChannels,
}

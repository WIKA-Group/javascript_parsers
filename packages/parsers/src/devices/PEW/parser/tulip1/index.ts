import type { Handler, TULIP1Channel } from '../../../../codecs/tulip1'
import type { PEWTULIP1DataMessageUplinkOutput, PEWTULIP1DeviceAlarmsData, PEWTULIP1DeviceAlarmsUplinkOutput, PEWTULIP1DeviceInformationData, PEWTULIP1DeviceInformationUplinkOutput, PEWTULIP1DeviceStatisticsData, PEWTULIP1DeviceStatisticsUplinkOutput, PEWTULIP1ProcessAlarmsData, PEWTULIP1ProcessAlarmsUplinkOutput, PEWTULIP1TechnicalAlarmsData, PEWTULIP1TechnicalAlarmsUplinkOutput } from '../../schema/tulip1'
import { PEW_NAME } from '..'
import { defineTULIP1Codec } from '../../../../codecs/tulip1'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { ALARM_EVENTS, DEVICE_ALARM_CAUSE_OF_FAILURE, DEVICE_ALARM_TYPES, PRESSURE_TYPES, PRESSURE_UNITS, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES } from './lookups'

const ERROR_VALUE = 0xFFFF

const channels = [
  {
    channelId: 0,
    name: 'pressure',
    start: 0 as number,
    end: 10 as number,
  },
  {
    channelId: 1,
    name: 'device temperature',
    start: -45 as number,
    end: 110 as number,
  },
] as const satisfies TULIP1Channel[]

const handleDataMessage: Handler<typeof channels, PEWTULIP1DataMessageUplinkOutput['data']> = (input, options) => {
  // validate that the message needs to be 7 bytes long
  if (input.bytes.length !== 7) {
    throw new Error(`Data message 01/02 needs 7 bytes but got ${input.bytes.length}`)
  }

  const messageType = input.bytes[0]! as 1 | 2

  const configurationId = input.bytes[1]!

  const pressureValue = roundValue(TULIPValueToValue(input.bytes[3]! << 8 | input.bytes[4]!, options.channels[0]), options.roundingDecimals)

  const temperatureValue = roundValue(TULIPValueToValue(input.bytes[5]! << 8 | input.bytes[6]!, options.channels[1]), options.roundingDecimals)

  const batteryValue = input.bytes[2]! / 10

  return {
    data: {
      configurationId,
      messageType,
      measurement: {
        channels: [
          {
            channelId: 0,
            channelName: 'pressure',
            value: pressureValue,
          },
          {
            channelId: 1,
            channelName: 'device temperature',
            value: temperatureValue,
          },
          {
            channelId: 2,
            channelName: 'battery voltage',
            value: batteryValue,
          },
        ],
      },
    },
  }
}

const handleProcessAlarmMessage: Handler<typeof channels, PEWTULIP1ProcessAlarmsUplinkOutput['data']> = (input, options) => {
  // validate that it needs atleast 5 bytes AND that length-2 % 3
  if (input.bytes.length < 5 || (input.bytes.length - 2) % 3 !== 0) {
    throw new Error(`Process alarm 03 needs at least 5 bytes and got ${input.bytes.length}. Also all bytes for each alarm needed`)
  }

  const configurationId = input.bytes[1]!

  const processAlarms: PEWTULIP1ProcessAlarmsData = []

  for (let byteIndex = 2; byteIndex < input.bytes.length; byteIndex += 3) {
    const channelId = ((input.bytes[byteIndex]! & 0x78) >> 3) as 0 | 1
    const channel = options.channels.find(c => c.channelId === channelId)
    if (!channel) {
      throw new TypeError(`Unknown channel ID: ${channelId} in process alarm message`)
    }

    const alarmType = (input.bytes[byteIndex]! & 0x07)
    const event = ((input.bytes[byteIndex]! & 0x80) >> 7)
    // if alarmType is 2 | 3 -> slopeValue with ranges else use TULIPValue
    const value = alarmType === 2 || alarmType === 3
      ? slopeValueToValue(input.bytes[byteIndex + 1]! << 8 | input.bytes[byteIndex + 2]!, channel)
      : TULIPValueToValue(input.bytes[byteIndex + 1]! << 8 | input.bytes[byteIndex + 2]!, channel)

    processAlarms.push({
      channelId,
      channelName: channel.name,
      value: roundValue(value, options.roundingDecimals),
      event,
      alarmType,
      alarmTypeName: Object.keys(PROCESS_ALARM_TYPES).find(key => PROCESS_ALARM_TYPES[key as keyof typeof PROCESS_ALARM_TYPES] === alarmType),
      eventName: Object.keys(ALARM_EVENTS).find(key => ALARM_EVENTS[key as keyof typeof ALARM_EVENTS] === event),
    } as PEWTULIP1ProcessAlarmsData[number])
  }

  const warnings: string[] = []

  const res: PEWTULIP1ProcessAlarmsUplinkOutput = {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }

  // if any of the values are the error value add a warning
  for (const alarm of processAlarms) {
    if (alarm.value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${alarm.channelName}channel`)
    }
  }

  if (warnings.length > 0) {
    res.warnings = warnings
  }

  return res
}

const handleTechnicalAlarmMessage: Handler<typeof channels, PEWTULIP1TechnicalAlarmsUplinkOutput['data']> = (input) => {
  // Technical alarm messages are exactly 3 bytes: [0x04, configurationId, alarmByte]
  if (input.bytes.length !== 3) {
    throw new Error(`Technical alarm 04 needs 3 bytes but got ${input.bytes.length}.`)
  }

  const configurationId = input.bytes[1]!

  const alarmByte = input.bytes[2]!

  // Bit 7 = event (0 = triggered, 1 = turned off)
  const event = ((alarmByte & 0x80) >> 7) as 0 | 1

  // Bits 6-0 = status bits
  const alarmType = alarmByte & 0x7F

  // Map set bits to human readable names from TECHNICAL_ALARM_TYPES
  const alarmTypeNames: (keyof typeof TECHNICAL_ALARM_TYPES)[] = [];

  (Object.entries(TECHNICAL_ALARM_TYPES) as [keyof typeof TECHNICAL_ALARM_TYPES, number][]).forEach(([name, bit]) => {
    if ((alarmType & bit) !== 0) {
      alarmTypeNames.push(name)
    }
  })

  const eventName = Object.keys(ALARM_EVENTS).find(k => (ALARM_EVENTS as any)[k] === event) as keyof typeof ALARM_EVENTS

  const res: PEWTULIP1TechnicalAlarmsUplinkOutput = {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms: [{
        event,
        eventName,
        alarmType,
        alarmTypeNames,
      }] as PEWTULIP1TechnicalAlarmsData,
    },
  }

  return res
}

const handleDeviceAlarmMessage: Handler<typeof channels, PEWTULIP1DeviceAlarmsUplinkOutput['data']> = (input) => {
  // Device alarm messages are 3 or 4 bytes: [0x05, configurationId, alarmByte, [value]]
  if (input.bytes.length < 3 || input.bytes.length > 4) {
    throw new Error(`Device alarm 05 needs 3 or 4 bytes but got ${input.bytes.length}.`)
  }

  const configurationId = input.bytes[1]!

  const alarmByte = input.bytes[2]!

  const event = ((alarmByte & 0x80) >> 7) as 0 | 1
  const eventName = Object.keys(ALARM_EVENTS).find(k => (ALARM_EVENTS as any)[k] === event) as keyof typeof ALARM_EVENTS

  const causeOfFailure = (alarmByte & 0x60) >> 6
  const causeOfFailureName = Object.keys(DEVICE_ALARM_CAUSE_OF_FAILURE).find(k => (DEVICE_ALARM_CAUSE_OF_FAILURE as any)[k] === causeOfFailure) as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE

  const alarmType = alarmByte & 0x1F
  const alarmTypeName = Object.keys(DEVICE_ALARM_TYPES).find(k => (DEVICE_ALARM_TYPES as any)[k] === alarmType) as keyof typeof DEVICE_ALARM_TYPES

  // low battery alarm (type 0) contains a signed int8 value at byte 3 divided by 10
  let value: number | undefined
  if (alarmType === 0 && input.bytes.length === 4) {
    value = input.bytes[3]! / 10
  }

  const data = {
    event,
    eventName,
    alarmType,
    alarmTypeName,
    causeOfFailure,
    causeOfFailureName,
  } as PEWTULIP1DeviceAlarmsData

  if (alarmType === 0) {
    data.value = value
  }

  const res: PEWTULIP1DeviceAlarmsUplinkOutput = {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm: data,
    },
  }

  return res
}

const handleDeviceIdentificationMessage: Handler<typeof channels, PEWTULIP1DeviceInformationUplinkOutput['data']> = (input) => {
  // validate if 8 or 38 bytes are present
  if (input.bytes.length !== 8 && input.bytes.length !== 38) {
    throw new Error(`Identification message 07 needs 8 or 38 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!

  const productId = input.bytes[2]!

  if (productId !== 11) {
    throw new Error(`Identification message 07 needs productId 11 but got ${productId}`)
  }

  const productIdName = 'PEW'

  const productSubId = input.bytes[3]!

  if (productSubId !== 0) {
    throw new Error(`Identification message 07 needs productSubId 0 but got ${productSubId}`)
  }

  // firmware version is semver with nibble.nibble.byte
  const wirelessModuleFirmwareVersion = `${(input.bytes[4]! >> 4) & 0x0F}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`

  const wirelessModuleHardwareVersion = `${(input.bytes[6]! >> 4) & 0x0F}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  if (input.bytes.length === 8) {
    return {
      data: {
        messageType: 0x07,
        configurationId,
        deviceInformation: {
          productId,
          productIdName,
          productSubId,
          productSubIdName: 'LoRaWAN',
          wirelessModuleFirmwareVersion,
          wirelessModuleHardwareVersion,
        } satisfies PEWTULIP1DeviceInformationData,
      },
    }
  }

  // read the next 11 bytes as ascii
  const serialNumber = String.fromCharCode(...input.bytes.slice(8, 19))

  const pressureTypeId = input.bytes[19]!

  if (!(pressureTypeId === 1) && !(pressureTypeId === 2)) {
    throw new Error(`Identification message 07 needs pressureTypeId 1 or 2 but got ${pressureTypeId}`)
  }

  const pressureType = Object.keys(PRESSURE_TYPES).find(typeName => (PRESSURE_TYPES)[typeName as keyof typeof PRESSURE_TYPES] === pressureTypeId)! as keyof typeof PRESSURE_TYPES

  const measurementRangeStartPressure = roundValue(intTuple4ToFloat32WithThreshold([input.bytes[20]!, input.bytes[21]!, input.bytes[22]!, input.bytes[23]!]))

  const measurementRangeEndPressure = roundValue(intTuple4ToFloat32WithThreshold([input.bytes[24]!, input.bytes[25]!, input.bytes[26]!, input.bytes[27]!]))

  const measurementRangeStartDeviceTemperature = roundValue(intTuple4ToFloat32WithThreshold([input.bytes[28]!, input.bytes[29]!, input.bytes[30]!, input.bytes[31]!]))

  const measurementRangeEndDeviceTemperature = roundValue(intTuple4ToFloat32WithThreshold([input.bytes[32]!, input.bytes[33]!, input.bytes[34]!, input.bytes[35]!]))

  const pressureUnit = input.bytes[36]!

  // must be 6,7, or 237
  if (![6, 7, 237].includes(pressureUnit)) {
    throw new Error(`Identification message 07 needs pressureUnit 6, 7, or 237 but got ${pressureUnit}`)
  }
  const pressureUnitName = Object.keys(PRESSURE_UNITS).find(key => PRESSURE_UNITS[key as keyof typeof PRESSURE_UNITS] === pressureUnit)!

  const deviceTemperatureUnit = input.bytes[37]!

  // must be 32
  if (deviceTemperatureUnit !== 32) {
    throw new Error(`Identification message 07 needs deviceTemperatureUnit 32 but got ${deviceTemperatureUnit}`)
  }

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productIdName,
        productId,
        productSubId,
        productSubIdName: 'LoRaWAN',
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        pressureType,
        measurementRangeStartPressure,
        measurementRangeEndPressure,
        measurementRangeStartDeviceTemperature,
        measurementRangeEndDeviceTemperature,
        pressureUnit,
        pressureUnitName,
        deviceTemperatureUnit,
        deviceTemperatureUnitName: '°C',
      } as PEWTULIP1DeviceInformationData,
    },
  }
}

const handleKeepAliveMessage: Handler<typeof channels, PEWTULIP1DeviceStatisticsUplinkOutput['data']> = (input) => {
  // Keep alive message is 3 bytes: [0x08, configurationId, batteryByte]
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message 08 needs 3 bytes but got ${input.bytes.length}.`)
  }

  const configurationId = input.bytes[1]!
  const batteryByte = input.bytes[2]!

  const batteryLevelNewEvent = ((batteryByte & 0x80) >> 7) === 1
  const batteryLevelPercent = batteryByte & 0x7F

  const res: PEWTULIP1DeviceStatisticsUplinkOutput = {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent,
        batteryLevelPercent,
      } as PEWTULIP1DeviceStatisticsData,
    },
  }

  return res
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP1PEWCodec() {
  return defineTULIP1Codec<typeof channels>({
    deviceName: PEW_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels,
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

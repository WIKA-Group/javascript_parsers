import type { Handler } from '../../../../codecs/tulip2'
import type {
  F98W6TULIP2DataMessageUplinkOutput,
  F98W6TULIP2DeviceAlarmsData,
  F98W6TULIP2DeviceAlarmsUplinkOutput,
  F98W6TULIP2DeviceInformationUplinkOutput,
  F98W6TULIP2DeviceStatisticsUplinkOutput,
  F98W6TULIP2ProcessAlarmsData,
  F98W6TULIP2ProcessAlarmsUplinkOutput,
  F98W6TULIP2TechnicalAlarmsData,
  F98W6TULIP2TechnicalAlarmsUplinkOutput,
  StrainUnitId,
  StrainUnitName,
  TemperatureUnitId,
  TemperatureUnitName,
} from '../../schema/tulip2'
import { F98W6_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createF98W6TULIP2Channels, F98W6_BATTERY_VOLTAGE_CHANNEL, F98W6_DEVICE_TEMPERATURE_CHANNEL, F98W6_STRAIN_CHANNEL } from './channels'
import {
  ALARM_EVENTS,
  DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE,
  DEVICE_ALARM_TYPES,
  PHYSICAL_UNIT_NAMES_BY_ID,
  PROCESS_ALARM_CHANNEL_NAMES_BY_ID,
  PROCESS_ALARM_TYPES,
  PRODUCT_SUB_ID_NAMES,
  STRAIN_TYPES_BY_ID,
  TECHNICAL_ALARM_TYPES,
} from './lookups'

const ERROR_VALUE = 0xFFFF

type F98W6Channels = ReturnType<typeof createF98W6TULIP2Channels>

type AlarmEvent = (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS]

const handleDataMessage: Handler<F98W6Channels, F98W6TULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length !== 7) {
    throw new Error(`Data message (0x01/0x02) requires 7 bytes, but received ${input.bytes.length} bytes`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!
  const batteryVoltage = input.bytes[2]! / 10
  const rawStrain = (input.bytes[3]! << 8) | input.bytes[4]!
  const rawTemperature = (input.bytes[5]! << 8) | input.bytes[6]!

  const strainChannel = options.channels.find((candidate): candidate is F98W6Channels[number] => candidate.channelId === F98W6_STRAIN_CHANNEL.channelId)
  const temperatureChannel = options.channels.find((candidate): candidate is F98W6Channels[number] => candidate.channelId === F98W6_DEVICE_TEMPERATURE_CHANNEL.channelId)

  if (!strainChannel || !temperatureChannel) {
    throw new Error('Channel configuration missing for strain or temperature channel')
  }

  const strainValue = roundValue(TULIPValueToValue(rawStrain, strainChannel), options.roundingDecimals)
  const temperatureValue = roundValue(TULIPValueToValue(rawTemperature, temperatureChannel), options.roundingDecimals)

  return {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels: [
          {
            channelId: strainChannel.channelId,
            channelName: strainChannel.name,
            value: strainValue,
          },
          {
            channelId: temperatureChannel.channelId,
            channelName: temperatureChannel.name,
            value: temperatureValue,
          },
          {
            channelId: F98W6_BATTERY_VOLTAGE_CHANNEL.channelId,
            channelName: F98W6_BATTERY_VOLTAGE_CHANNEL.name,
            value: roundValue(batteryVoltage, options.roundingDecimals),
          },
        ],
      },
    },
  }
}

const handleProcessAlarmMessage: Handler<F98W6Channels, F98W6TULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 5 || ((input.bytes.length - 2) % 3) !== 0) {
    throw new Error(`Process alarm message (0x03) requires at least 5 bytes (and target byte count 3n+2), but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: F98W6TULIP2ProcessAlarmsData = []
  const warnings: string[] = []

  for (let byteIndex = 2, alarmIndex = 0; byteIndex < input.bytes.length; byteIndex += 3, alarmIndex += 1) {
    const header = input.bytes[byteIndex]!
    const event = ((header & 0x80) >> 7) as AlarmEvent
    const channelId = (header & 0x78) >> 3
    const alarmType = header & 0x07
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!

    const alarmTypeName = (Object.entries(PROCESS_ALARM_TYPES) as [keyof typeof PROCESS_ALARM_TYPES, number][]).find(([, id]) => id === alarmType)?.[0]
    const eventName = (Object.entries(ALARM_EVENTS) as [keyof typeof ALARM_EVENTS, number][]).find(([, id]) => id === event)?.[0]
    const channelName = PROCESS_ALARM_CHANNEL_NAMES_BY_ID[channelId as keyof typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID]

    if (!alarmTypeName) {
      throw new Error(`Unknown alarmType ${alarmType} in process alarm message`)
    }

    if (!eventName) {
      throw new Error(`Unknown event ${event} in process alarm message`)
    }

    if (!channelName) {
      throw new Error(`Unknown channelId ${channelId} in process alarm message`)
    }

    const channel = options.channels.find(candidate => candidate.channelId === channelId)
    if (!channel) {
      throw new Error(`Channel configuration missing for channelId ${channelId} in process alarm message`)
    }

    let value: number
    if (rawValue === ERROR_VALUE) {
      value = ERROR_VALUE
    }
    else if (alarmType === PROCESS_ALARM_TYPES['rising slope'] || alarmType === PROCESS_ALARM_TYPES['low threshold with delay']) {
      value = roundValue(slopeValueToValue(rawValue, channel), options.roundingDecimals)
    }
    else {
      value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)
    }

    processAlarms[alarmIndex] = {
      channelId,
      channelName,
      event,
      eventName,
      alarmType,
      alarmTypeName,
      value,
    } as F98W6TULIP2ProcessAlarmsData[number]

    if (value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${channelName} channel`)
    }
  }

  const result: F98W6TULIP2ProcessAlarmsUplinkOutput = {
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

const handleTechnicalAlarmMessage: Handler<F98W6Channels, F98W6TULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Technical alarm message (0x04) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const payload = input.bytes[2]!
  const event = ((payload & 0x80) >> 7) as AlarmEvent
  const alarmType = payload & 0x7F

  const eventName = (Object.entries(ALARM_EVENTS) as [keyof typeof ALARM_EVENTS, number][]).find(([, id]) => id === event)?.[0]
  if (!eventName) {
    throw new Error(`Unknown event ${event} in technical alarm message`)
  }

  const alarmTypeEntry = (Object.entries(TECHNICAL_ALARM_TYPES) as [keyof typeof TECHNICAL_ALARM_TYPES, number][]).find(([, mask]) => (alarmType & mask) !== 0)
  if (!alarmTypeEntry) {
    throw new Error(`Unknown technical alarm type ${alarmType} in technical alarm message`)
  }

  const [alarmTypeName, normalizedAlarmType] = alarmTypeEntry

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms: [
        {
          alarmType: normalizedAlarmType,
          alarmTypeName,
          event,
          eventName,
        },
      ] as F98W6TULIP2TechnicalAlarmsData,
    },
  }
}

const handleDeviceAlarmMessage: Handler<F98W6Channels, F98W6TULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length < 3 || input.bytes.length > 4) {
    throw new Error(`Device alarm message (0x05) requires 3 or 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const payload = input.bytes[2]!
  const event = ((payload & 0x80) >> 7) as AlarmEvent
  const eventName = (Object.entries(ALARM_EVENTS) as [keyof typeof ALARM_EVENTS, number][]).find(([, id]) => id === event)?.[0]
  if (!eventName) {
    throw new Error(`Unknown event ${event} in device alarm message`)
  }
  const causeOfFailure = (payload & 0x60) >> 6
  const causeOfFailureName = DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE[causeOfFailure as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE]
    ?? DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE[1]
  const rawAlarmType = payload & 0x1F
  const alarmTypeEntry = (Object.entries(DEVICE_ALARM_TYPES) as Array<[
    keyof typeof DEVICE_ALARM_TYPES,
    (typeof DEVICE_ALARM_TYPES)[keyof typeof DEVICE_ALARM_TYPES],
  ]>).find(([, id]) => id === rawAlarmType)
  if (!alarmTypeEntry) {
    throw new Error(`Unknown alarmType ${rawAlarmType} in device alarm message`)
  }
  const [alarmTypeName, alarmType] = alarmTypeEntry

  const deviceAlarm: F98W6TULIP2DeviceAlarmsData = {
    event,
    eventName,
    causeOfFailure,
    causeOfFailureName,
    alarmType,
    alarmTypeName,
  }

  if (alarmType === DEVICE_ALARM_TYPES['low battery alarm']) {
    if (input.bytes.length < 4) {
      throw new Error('Device alarm 05 payload missing battery value byte')
    }
    deviceAlarm.batteryValue = input.bytes[3]! / 10
  }

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm,
    },
  }
}

const handleDeviceIdentificationMessage: Handler<F98W6Channels, F98W6TULIP2DeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length < 8 || input.bytes.length > 38) {
    throw new Error(`Device identification message (0x07) requires at least 8 and at most 38 bytes, but received ${input.bytes.length} bytes`)
  }

  if (input.bytes.length < 38) {
    throw new Error(`Device identification frame 07 has not all bytes included, received ${input.bytes.length}/38 bytes`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  if (productId !== 18) {
    throw new Error(`Invalid productId ${productId} in device identification message. Expected 18 (F98W6).`)
  }
  const productIdName = 'F98W6'
  const productSubId = input.bytes[3]!
  const productSubIdName = (Object.entries(PRODUCT_SUB_ID_NAMES) as [keyof typeof PRODUCT_SUB_ID_NAMES, number][]).find(([, id]) => id === productSubId)?.[0]

  if (!productSubIdName) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message. Only LoRaWAN (0) is supported.`)
  }

  const wirelessModuleFirmwareVersion = `${(input.bytes[4]! >> 4) & 0x0F}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`
  const wirelessModuleHardwareVersion = `${(input.bytes[6]! >> 4) & 0x0F}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  let serialNumber = ''
  for (let index = 8; index < 19; index += 1) {
    const char = input.bytes[index]!
    if (char === 0) {
      break
    }
    serialNumber += String.fromCharCode(char)
  }

  const strainType = STRAIN_TYPES_BY_ID[input.bytes[19]! as keyof typeof STRAIN_TYPES_BY_ID] ?? 'unknown'

  const measurementRangeStartStrain = intTuple4ToFloat32WithThreshold([
    input.bytes[20]!,
    input.bytes[21]!,
    input.bytes[22]!,
    input.bytes[23]!,
  ])

  const measurementRangeEndStrain = intTuple4ToFloat32WithThreshold([
    input.bytes[24]!,
    input.bytes[25]!,
    input.bytes[26]!,
    input.bytes[27]!,
  ])

  const measurementRangeStartDeviceTemperature = intTuple4ToFloat32WithThreshold([
    input.bytes[28]!,
    input.bytes[29]!,
    input.bytes[30]!,
    input.bytes[31]!,
  ])

  const measurementRangeEndDeviceTemperature = intTuple4ToFloat32WithThreshold([
    input.bytes[32]!,
    input.bytes[33]!,
    input.bytes[34]!,
    input.bytes[35]!,
  ])

  const strainUnit = input.bytes[36]!
  const strainUnitName = PHYSICAL_UNIT_NAMES_BY_ID[strainUnit as keyof typeof PHYSICAL_UNIT_NAMES_BY_ID] ?? 'Unknown'
  const deviceTemperatureUnit = input.bytes[37]!
  const deviceTemperatureUnitName = PHYSICAL_UNIT_NAMES_BY_ID[deviceTemperatureUnit as keyof typeof PHYSICAL_UNIT_NAMES_BY_ID] ?? 'Unknown'

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productId,
        productIdName,
        productSubId: productSubId as 0,
        productSubIdName: productSubIdName as 'LoRaWAN',
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        strainType,
        measurementRangeStartStrain,
        measurementRangeEndStrain,
        measurementRangeStartDeviceTemperature,
        measurementRangeEndDeviceTemperature,
        strainUnit: strainUnit as StrainUnitId,
        strainUnitName: strainUnitName as StrainUnitName,
        deviceTemperatureUnit: deviceTemperatureUnit as TemperatureUnitId,
        deviceTemperatureUnitName: deviceTemperatureUnitName as TemperatureUnitName,
      },
    },
  } satisfies F98W6TULIP2DeviceInformationUplinkOutput
}

const handleKeepAliveMessage: Handler<F98W6Channels, F98W6TULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message (0x08) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const payload = input.bytes[2]!

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent: ((payload & 0x80) >> 7) !== 0,
        batteryLevelPercent: payload & 0x7F,
      },
    },
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createF98W6TULIP2Codec() {
  return defineTULIP2Codec({
    deviceName: F98W6_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createF98W6TULIP2Channels(),
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
